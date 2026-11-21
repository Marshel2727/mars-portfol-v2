import json
import os
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from flask import current_app


_CACHE_TTL_SECONDS = 5.0
_cache_lock = threading.Lock()
_cache_entry = {'timestamp': 0.0, 'url': '', 'data': None}


class VpsMonitorError(Exception):
    """Domain error raised when the VPS monitor agent is misconfigured or unreachable."""

    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def clear_vps_cache():
    """Reset the in-memory metrics cache (primarily for tests)."""
    with _cache_lock:
        _cache_entry['timestamp'] = 0.0
        _cache_entry['url'] = ''
        _cache_entry['data'] = None


def _get_monitor_config():
    url = (current_app.config.get('VPS_MONITOR_URL') or os.getenv('VPS_MONITOR_URL') or '').strip()
    token = (current_app.config.get('VPS_MONITOR_TOKEN') or os.getenv('VPS_MONITOR_TOKEN') or '').strip()
    raw_timeout = current_app.config.get('VPS_MONITOR_TIMEOUT', os.getenv('VPS_MONITOR_TIMEOUT', '8'))
    try:
        timeout = max(1.0, min(float(raw_timeout), 30.0))
    except (TypeError, ValueError):
        timeout = 8.0
    return url, token, timeout


def fetch_vps_metrics(force_refresh: bool = False) -> dict:
    """Fetch read-only VPS metrics from the configured host agent with a short TTL cache."""
    url, token, timeout = _get_monitor_config()
    if not url:
        raise VpsMonitorError(
            'Agent monitoring VPS belum dikonfigurasi (VPS_MONITOR_URL belum diisi).',
            status_code=503,
        )

    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise VpsMonitorError('Konfigurasi VPS_MONITOR_URL tidak valid.', status_code=503)

    now = time.monotonic()
    if not force_refresh:
        with _cache_lock:
            if (
                _cache_entry['data'] is not None
                and _cache_entry['url'] == url
                and (now - _cache_entry['timestamp']) < _CACHE_TTL_SECONDS
            ):
                return _cache_entry['data']

    headers = {'Accept': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = Request(url, headers=headers, method='GET')
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw_body = resp.read()
    except HTTPError as exc:
        if exc.code in (401, 403):
            raise VpsMonitorError('Token autentikasi VPS monitor ditolak agent.', status_code=502) from exc
        raise VpsMonitorError('Agent monitoring VPS mengembalikan respons error.', status_code=502) from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise VpsMonitorError('Tidak dapat terhubung ke agent monitoring VPS.', status_code=503) from exc

    try:
        payload = json.loads(raw_body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise VpsMonitorError('Format data dari agent monitoring VPS tidak valid.', status_code=502) from exc

    if not isinstance(payload, dict) or 'host' not in payload or 'memory' not in payload:
        raise VpsMonitorError('Struktur metrik dari agent monitoring VPS tidak lengkap.', status_code=502)

    with _cache_lock:
        _cache_entry['timestamp'] = time.monotonic()
        _cache_entry['url'] = url
        _cache_entry['data'] = payload

    return payload
