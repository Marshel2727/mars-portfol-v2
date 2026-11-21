#!/usr/bin/env python3
"""Lightweight, read-only HTTP metrics agent for the VPS host.

Runs on the host (bound to localhost or docker0 bridge IP) using only the
Python 3 standard library so backend containers can fetch host & Docker stats
without mounting /var/run/docker.sock.
"""

from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import json
import os
from pathlib import Path
import platform
import re
import shutil
import socket
import subprocess
import sys
import time


_SIZE_PATTERN = re.compile(r'^\s*([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)?\s*$')
_SIZE_MULTIPLIERS = {
    '': 1,
    'b': 1,
    'k': 1024,
    'kb': 1000,
    'kib': 1024,
    'm': 1024 ** 2,
    'mb': 1000 ** 2,
    'mib': 1024 ** 2,
    'g': 1024 ** 3,
    'gb': 1000 ** 3,
    'gib': 1024 ** 3,
    't': 1024 ** 4,
    'tb': 1000 ** 4,
    'tib': 1024 ** 4,
}


def parse_size_to_bytes(value: str) -> int:
    """Convert human-readable Docker size strings (e.g. '18.01MiB', '1.2GB') to bytes."""
    if not isinstance(value, str):
        return 0
    match = _SIZE_PATTERN.match(value)
    if not match:
        return 0
    number = float(match.group(1))
    unit = (match.group(2) or '').lower()
    multiplier = _SIZE_MULTIPLIERS.get(unit)
    if multiplier is None:
        return 0
    return int(round(number * multiplier))


def parse_pct(value: str) -> float:
    """Parse percentage strings like '2.15%' into a float."""
    if not isinstance(value, str):
        return 0.0
    cleaned = value.strip().rstrip('%').strip()
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return 0.0


def parse_docker_mem_usage(value: str) -> tuple[int, int]:
    """Parse Docker stats MemUsage strings like '18.01MiB / 837MiB'."""
    if not isinstance(value, str) or '/' not in value:
        return 0, 0
    used_part, limit_part = value.split('/', 1)
    return parse_size_to_bytes(used_part), parse_size_to_bytes(limit_part)


def parse_meminfo(text: str) -> tuple[dict, dict]:
    """Parse /proc/meminfo contents into memory and swap metric dictionaries."""
    fields = {}
    for line in (text or '').splitlines():
        if ':' not in line:
            continue
        key, raw_val = line.split(':', 1)
        parts = raw_val.strip().split()
        if not parts:
            continue
        try:
            amount = int(parts[0])
        except ValueError:
            continue
        unit = parts[1].lower() if len(parts) > 1 else ''
        fields[key.strip()] = amount * 1024 if unit == 'kb' else amount

    total = fields.get('MemTotal', 0)
    free = fields.get('MemFree', 0)
    buffers = fields.get('Buffers', 0)
    cached = fields.get('Cached', 0)
    s_reclaimable = fields.get('SReclaimable', 0)
    cached_total = buffers + cached + s_reclaimable
    available = fields.get('MemAvailable', min(total, free + cached_total))
    used = max(total - available, 0)
    used_pct = round((used / total) * 100, 1) if total > 0 else 0.0

    swap_total = fields.get('SwapTotal', 0)
    swap_free = fields.get('SwapFree', 0)
    swap_used = max(swap_total - swap_free, 0)
    swap_pct = round((swap_used / swap_total) * 100, 1) if swap_total > 0 else 0.0

    memory_data = {
        'total_bytes': total,
        'used_bytes': used,
        'available_bytes': available,
        'free_bytes': free,
        'cached_bytes': cached_total,
        'used_pct': used_pct,
    }
    swap_data = {
        'total_bytes': swap_total,
        'used_bytes': swap_used,
        'free_bytes': swap_free,
        'used_pct': swap_pct,
        'devices': [],
    }
    return memory_data, swap_data


def parse_swaps(text: str) -> list[dict]:
    """Parse /proc/swaps contents into a list of swap device descriptors."""
    devices = []
    for index, line in enumerate((text or '').splitlines()):
        stripped = line.strip()
        if not stripped or (index == 0 and stripped.startswith('Filename')):
            continue
        parts = stripped.split()
        if len(parts) < 5:
            continue
        try:
            size_bytes = int(parts[2]) * 1024
            used_bytes = int(parts[3]) * 1024
            priority = int(parts[4])
        except ValueError:
            continue
        devices.append({
            'name': parts[0],
            'type': parts[1],
            'size_bytes': size_bytes,
            'used_bytes': used_bytes,
            'priority': priority,
        })
    return devices


def compute_health(cpu: dict, memory: dict, swap: dict, disk: dict, docker: dict) -> dict:
    """Derive overall health status ('healthy' | 'warning' | 'critical') and Indonesian alerts."""
    alerts = []
    severity = 0  # 0=healthy, 1=warning, 2=critical

    disk_pct = float(disk.get('used_pct', 0.0))
    swap_pct = float(swap.get('used_pct', 0.0))
    mem_pct = float(memory.get('used_pct', 0.0))
    load_pct = float(cpu.get('load_1m_pct', 0.0))

    if disk_pct >= 90:
        severity = max(severity, 2)
        alerts.append(f'Penggunaan disk kritis ({disk_pct:.1f}%). Segera bersihkan ruang disk.')
    elif disk_pct >= 80:
        severity = max(severity, 1)
        alerts.append(f'Penggunaan disk tinggi ({disk_pct:.1f}%). Pertimbangkan pembersihan cache/log.')

    if swap.get('total_bytes', 0) > 0:
        if swap_pct >= 85:
            severity = max(severity, 2)
            alerts.append(f'Penggunaan swap sangat tinggi ({swap_pct:.1f}%). Memori fisik padat.')
        elif swap_pct >= 70:
            severity = max(severity, 1)
            alerts.append(f'Penggunaan swap meningkat ({swap_pct:.1f}%).')

    if mem_pct >= 92:
        severity = max(severity, 2)
        alerts.append(f'RAM fisik hampir penuh ({mem_pct:.1f}%).')
    elif mem_pct >= 80:
        severity = max(severity, 1)
        alerts.append(f'RAM fisik mulai padat ({mem_pct:.1f}%).')

    if load_pct >= 95:
        severity = max(severity, 2)
        alerts.append(f'Beban CPU sangat tinggi (load {cpu.get("load_1m", 0):.2f} / {cpu.get("cores", 1)} vCPU).')
    elif load_pct >= 85:
        severity = max(severity, 1)
        alerts.append(f'Beban CPU meningkat (load {cpu.get("load_1m", 0):.2f} / {cpu.get("cores", 1)} vCPU).')

    if not docker.get('available', False):
        severity = max(severity, 1)
        alerts.append('Docker daemon tidak merespons atau tidak dapat diakses oleh agent.')

    status_map = {0: 'healthy', 1: 'warning', 2: 'critical'}
    return {'status': status_map[severity], 'alerts': alerts}


def _read_proc_stat_cpu() -> tuple[int, int] | None:
    stat_path = Path('/proc/stat')
    if not stat_path.is_file():
        return None
    try:
        first_line = stat_path.read_text(encoding='utf-8').splitlines()[0]
    except (OSError, IndexError):
        return None
    parts = first_line.split()
    if len(parts) < 5 or parts[0] != 'cpu':
        return None
    try:
        values = [int(item) for item in parts[1:]]
    except ValueError:
        return None
    idle = values[3] + (values[4] if len(values) > 4 else 0)
    total = sum(values)
    return total, idle


def sample_cpu_usage_pct(fallback_pct: float = 0.0) -> float:
    """Measure short-window CPU utilization from /proc/stat, or return fallback_pct."""
    first = _read_proc_stat_cpu()
    if first is None:
        return round(fallback_pct, 1)
    time.sleep(0.15)
    second = _read_proc_stat_cpu()
    if second is None:
        return round(fallback_pct, 1)
    total_delta = second[0] - first[0]
    idle_delta = second[1] - first[1]
    if total_delta <= 0:
        return round(fallback_pct, 1)
    busy_pct = max(0.0, min(100.0, ((total_delta - idle_delta) / total_delta) * 100.0))
    return round(busy_pct, 1)


def _read_os_name() -> str:
    os_release = Path('/etc/os-release')
    if os_release.is_file():
        try:
            for line in os_release.read_text(encoding='utf-8').splitlines():
                if line.startswith('PRETTY_NAME='):
                    return line.split('=', 1)[1].strip().strip('"')
        except OSError:
            pass
    return platform.platform()


def _read_cpu_model() -> str:
    cpuinfo = Path('/proc/cpuinfo')
    if cpuinfo.is_file():
        try:
            for line in cpuinfo.read_text(encoding='utf-8').splitlines():
                if line.lower().startswith('model name'):
                    return line.split(':', 1)[1].strip()
        except OSError:
            pass
    return platform.processor() or platform.machine() or 'Unknown CPU'


def _read_uptime_seconds() -> int:
    uptime_path = Path('/proc/uptime')
    if uptime_path.is_file():
        try:
            raw = uptime_path.read_text(encoding='utf-8').split()[0]
            return int(float(raw))
        except (OSError, IndexError, ValueError):
            pass
    return 0


def _run_command(args: list[str], timeout: float = 5.0) -> str | None:
    try:
        completed = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if completed.returncode != 0:
        return None
    return completed.stdout


def _parse_json_lines(raw: str | None) -> list[dict]:
    if not raw:
        return []
    items = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict):
                items.append(parsed)
        except json.JSONDecodeError:
            continue
    return items


def collect_docker_info() -> dict:
    """Collect read-only Docker container list, live stats, and disk usage."""
    ps_raw = _run_command(['docker', 'ps', '-a', '--no-trunc', '--format', '{{json .}}'], timeout=5.0)
    if ps_raw is None:
        return {
            'available': False,
            'running_count': 0,
            'stopped_count': 0,
            'total_count': 0,
            'disk_usage': [],
            'containers': [],
        }

    ps_items = _parse_json_lines(ps_raw)
    stats_items = _parse_json_lines(
        _run_command(['docker', 'stats', '--no-stream', '--format', '{{json .}}'], timeout=8.0)
    )
    df_items = _parse_json_lines(
        _run_command(['docker', 'system', 'df', '--format', '{{json .}}'], timeout=5.0)
    )

    stats_by_name = {}
    stats_by_id = {}
    for row in stats_items:
        name = (row.get('Name') or '').lstrip('/')
        cid = row.get('ID') or ''
        if name:
            stats_by_name[name] = row
        if cid:
            stats_by_id[cid] = row

    containers = []
    running_count = 0
    stopped_count = 0

    for row in ps_items:
        full_id = row.get('ID') or ''
        short_id = full_id[:12]
        name = (row.get('Names') or '').split(',')[0].lstrip('/') or short_id
        state = (row.get('State') or 'unknown').lower()
        if state == 'running':
            running_count += 1
        else:
            stopped_count += 1

        stat = stats_by_name.get(name) or stats_by_id.get(short_id) or stats_by_id.get(full_id)
        if not stat and short_id:
            for key, candidate in stats_by_id.items():
                if full_id.startswith(key) or key.startswith(short_id):
                    stat = candidate
                    break

        mem_usage_text = (stat or {}).get('MemUsage') or '0B / 0B'
        mem_used_bytes, mem_limit_bytes = parse_docker_mem_usage(mem_usage_text)
        containers.append({
            'id': short_id,
            'name': name,
            'image': row.get('Image') or '',
            'state': state,
            'status': row.get('Status') or '',
            'cpu_pct': parse_pct((stat or {}).get('CPUPerc') or '0%'),
            'mem_usage_text': mem_usage_text,
            'mem_used_bytes': mem_used_bytes,
            'mem_limit_bytes': mem_limit_bytes,
            'mem_pct': parse_pct((stat or {}).get('MemPerc') or '0%'),
            'net_io': (stat or {}).get('NetIO') or '-',
            'block_io': (stat or {}).get('BlockIO') or '-',
            'pids': str((stat or {}).get('PIDs') or '0'),
        })

    containers.sort(key=lambda item: (0 if item['state'] == 'running' else 1, -item['mem_used_bytes'], item['name']))

    disk_usage = [
        {
            'type': str(entry.get('Type') or ''),
            'total_count': str(entry.get('TotalCount') or '0'),
            'active': str(entry.get('Active') or '0'),
            'size': str(entry.get('Size') or '0B'),
            'reclaimable': str(entry.get('Reclaimable') or '0B'),
        }
        for entry in df_items
    ]

    return {
        'available': True,
        'running_count': running_count,
        'stopped_count': stopped_count,
        'total_count': len(containers),
        'disk_usage': disk_usage,
        'containers': containers,
    }


def collect_top_processes(limit: int = 8) -> list[dict]:
    """Return the top host processes sorted by resident memory percentage."""
    raw = _run_command(['ps', '-eo', 'pid,comm,%cpu,%mem', '--sort=-%mem'], timeout=3.0)
    if not raw:
        return []
    processes = []
    for line in raw.splitlines()[1:]:
        parts = line.split(None, 3)
        if len(parts) < 4:
            continue
        try:
            pid = int(parts[0])
            cpu_pct = float(parts[2])
            mem_pct = float(parts[3])
        except ValueError:
            continue
        processes.append({
            'pid': pid,
            'command': parts[1],
            'cpu_pct': round(cpu_pct, 1),
            'mem_pct': round(mem_pct, 1),
        })
        if len(processes) >= limit:
            break
    return processes


def collect_metrics() -> dict:
    """Gather all host and Docker metrics into the shared JSON contract."""
    cores = os.cpu_count() or 1
    if hasattr(os, 'getloadavg'):
        try:
            load_1m, load_5m, load_15m = os.getloadavg()
        except OSError:
            load_1m, load_5m, load_15m = (0.0, 0.0, 0.0)
    else:
        load_1m, load_5m, load_15m = (0.0, 0.0, 0.0)

    load_1m_pct = round(min((load_1m / cores) * 100.0, 999.0), 1)
    load_5m_pct = round(min((load_5m / cores) * 100.0, 999.0), 1)
    load_15m_pct = round(min((load_15m / cores) * 100.0, 999.0), 1)
    cpu_usage_pct = sample_cpu_usage_pct(fallback_pct=min(load_1m_pct, 100.0))

    meminfo_path = Path('/proc/meminfo')
    if meminfo_path.is_file():
        meminfo_text = meminfo_path.read_text(encoding='utf-8')
        memory_data, swap_data = parse_meminfo(meminfo_text)
    else:
        memory_data = {
            'total_bytes': 0,
            'used_bytes': 0,
            'available_bytes': 0,
            'free_bytes': 0,
            'cached_bytes': 0,
            'used_pct': 0.0,
        }
        swap_data = {
            'total_bytes': 0,
            'used_bytes': 0,
            'free_bytes': 0,
            'used_pct': 0.0,
            'devices': [],
        }

    swaps_path = Path('/proc/swaps')
    if swaps_path.is_file():
        swap_data['devices'] = parse_swaps(swaps_path.read_text(encoding='utf-8'))

    root_mount = '/' if os.name != 'nt' else os.path.abspath(os.sep)
    disk_stats = shutil.disk_usage(root_mount)
    disk_used_pct = round((disk_stats.used / disk_stats.total) * 100.0, 1) if disk_stats.total > 0 else 0.0
    disk_data = {
        'mount': root_mount,
        'total_bytes': disk_stats.total,
        'used_bytes': disk_stats.used,
        'free_bytes': disk_stats.free,
        'used_pct': disk_used_pct,
    }

    cpu_data = {
        'cores': cores,
        'usage_pct': cpu_usage_pct,
        'load_1m': round(load_1m, 2),
        'load_5m': round(load_5m, 2),
        'load_15m': round(load_15m, 2),
        'load_1m_pct': load_1m_pct,
        'load_5m_pct': load_5m_pct,
        'load_15m_pct': load_15m_pct,
    }

    docker_data = collect_docker_info()
    top_processes = collect_top_processes()
    health_data = compute_health(cpu_data, memory_data, swap_data, disk_data, docker_data)

    return {
        'collected_at': datetime.now(timezone.utc).isoformat(),
        'host': {
            'hostname': socket.gethostname(),
            'os': _read_os_name(),
            'kernel': platform.release(),
            'architecture': platform.machine(),
            'uptime_seconds': _read_uptime_seconds(),
            'cpu_model': _read_cpu_model(),
            'cpu_cores': cores,
        },
        'cpu': cpu_data,
        'memory': memory_data,
        'swap': swap_data,
        'disk': disk_data,
        'docker': docker_data,
        'top_processes': top_processes,
        'health': health_data,
    }


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def create_handler(expected_token: str):
    """Build a request handler bound to the expected Bearer token."""

    class MonitorHandler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            # Keep journal logs concise and never log Authorization headers.
            return

        def _send_json(self, status_code: int, payload: dict):
            body = json.dumps(payload).encode('utf-8')
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(body)

        def _is_authorized(self) -> bool:
            header = self.headers.get('Authorization', '')
            if not header.startswith('Bearer '):
                return False
            provided = header[len('Bearer '):].strip()
            if not provided or not expected_token:
                return False
            return hmac.compare_digest(provided, expected_token)

        def _method_not_allowed(self):
            self._send_json(405, {'status': 'error', 'message': 'Method not allowed'})

        def do_GET(self):
            path = self.path.split('?', 1)[0]
            if path == '/health':
                self._send_json(200, {'status': 'ok'})
                return
            if path == '/metrics':
                if not self._is_authorized():
                    self._send_json(401, {'status': 'error', 'message': 'Unauthorized'})
                    return
                self._send_json(200, collect_metrics())
                return
            self._send_json(404, {'status': 'error', 'message': 'Not found'})

        def do_POST(self):
            self._method_not_allowed()

        def do_PUT(self):
            self._method_not_allowed()

        def do_DELETE(self):
            self._method_not_allowed()

        def do_PATCH(self):
            self._method_not_allowed()

    return MonitorHandler


def main():
    token = os.getenv('VPS_MONITOR_TOKEN', '').strip()
    if not token:
        print('ERROR: VPS_MONITOR_TOKEN environment variable is required.', file=sys.stderr)
        sys.exit(1)

    bind_host = os.getenv('VPS_MONITOR_BIND', '127.0.0.1').strip() or '127.0.0.1'
    port = int(os.getenv('VPS_MONITOR_PORT', '9109'))

    server = ReusableThreadingHTTPServer((bind_host, port), create_handler(token))
    print(f'VPS monitor agent listening on http://{bind_host}:{port} (read-only)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
