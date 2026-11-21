import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

os.environ.setdefault('JWT_SECRET_KEY', 'isolated-test-secret-at-least-32-characters')
os.environ.setdefault('FRONTEND_URL', 'http://localhost:3000')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from flask_jwt_extended import create_access_token
from app import create_app, db
from app.models.user import User
from app.service.vps_service import clear_vps_cache


AGENT_PATH = Path(__file__).resolve().parents[2] / 'deploy' / 'vps-monitor' / 'vps_monitor_agent.py'
_agent_spec = importlib.util.spec_from_file_location('vps_monitor_agent', AGENT_PATH)
agent_mod = importlib.util.module_from_spec(_agent_spec)
_agent_spec.loader.exec_module(agent_mod)


SAMPLE_MEMINFO = """\
MemTotal:        856064 kB
MemFree:          40960 kB
MemAvailable:    411648 kB
Buffers:          32768 kB
Cached:          310272 kB
SReclaimable:     60416 kB
SwapTotal:      4194304 kB
SwapFree:       2306867 kB
"""

SAMPLE_SWAPS = """\
Filename\t\t\t\tType\t\tSize\t\tUsed\t\tPriority
/swapfile                               file\t\t2097148\t\t1887436\t\t-1
/swapfile2                              file\t\t2097148\t\t0\t\t-2
"""


class VpsAgentUnitTests(unittest.TestCase):
    def test_parse_meminfo_and_swaps(self):
        memory, swap = agent_mod.parse_meminfo(SAMPLE_MEMINFO)
        self.assertEqual(memory['total_bytes'], 856064 * 1024)
        self.assertEqual(memory['available_bytes'], 411648 * 1024)
        self.assertEqual(memory['used_bytes'], (856064 - 411648) * 1024)
        self.assertEqual(memory['cached_bytes'], (32768 + 310272 + 60416) * 1024)
        self.assertAlmostEqual(memory['used_pct'], 51.9, places=1)

        self.assertEqual(swap['total_bytes'], 4194304 * 1024)
        self.assertEqual(swap['free_bytes'], 2306867 * 1024)
        self.assertAlmostEqual(swap['used_pct'], 45.0, places=1)

        devices = agent_mod.parse_swaps(SAMPLE_SWAPS)
        self.assertEqual(len(devices), 2)
        self.assertEqual(devices[0]['name'], '/swapfile')
        self.assertEqual(devices[0]['type'], 'file')
        self.assertEqual(devices[0]['size_bytes'], 2097148 * 1024)
        self.assertEqual(devices[0]['used_bytes'], 1887436 * 1024)
        self.assertEqual(devices[0]['priority'], -1)
        self.assertEqual(devices[1]['name'], '/swapfile2')

    def test_parse_size_to_bytes_and_docker_mem(self):
        self.assertEqual(agent_mod.parse_size_to_bytes('0B'), 0)
        self.assertEqual(agent_mod.parse_size_to_bytes('1KiB'), 1024)
        self.assertEqual(agent_mod.parse_size_to_bytes('1.5MiB'), int(1.5 * 1024 * 1024))
        self.assertEqual(agent_mod.parse_size_to_bytes('2GB'), 2 * 1000 ** 3)
        used, limit = agent_mod.parse_docker_mem_usage('18.01MiB / 837MiB')
        self.assertGreater(used, 18 * 1024 * 1024)
        self.assertEqual(limit, 837 * 1024 * 1024)

    def test_compute_health_levels(self):
        healthy = agent_mod.compute_health(
            {'load_1m': 0.4, 'cores': 2, 'load_1m_pct': 20.0},
            {'used_pct': 50.0},
            {'total_bytes': 4000, 'used_pct': 45.0},
            {'used_pct': 54.0},
            {'available': True},
        )
        self.assertEqual(healthy['status'], 'healthy')
        self.assertEqual(healthy['alerts'], [])

        warning = agent_mod.compute_health(
            {'load_1m': 1.8, 'cores': 2, 'load_1m_pct': 90.0},
            {'used_pct': 82.0},
            {'total_bytes': 4000, 'used_pct': 72.0},
            {'used_pct': 81.0},
            {'available': True},
        )
        self.assertEqual(warning['status'], 'warning')
        self.assertEqual(len(warning['alerts']), 4)

        critical = agent_mod.compute_health(
            {'load_1m': 0.5, 'cores': 2, 'load_1m_pct': 25.0},
            {'used_pct': 55.0},
            {'total_bytes': 4000, 'used_pct': 86.0},
            {'used_pct': 91.0},
            {'available': False},
        )
        self.assertEqual(critical['status'], 'critical')
        self.assertGreaterEqual(len(critical['alerts']), 3)

    def test_agent_http_server_auth_and_methods(self):
        token = 'super-secret-agent-token'
        server = agent_mod.ReusableThreadingHTTPServer(('127.0.0.1', 0), agent_mod.create_handler(token))
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with urlopen(f'http://127.0.0.1:{port}/health', timeout=3) as resp:
                self.assertEqual(resp.status, 200)
                self.assertEqual(json.loads(resp.read().decode('utf-8'))['status'], 'ok')

            with self.assertRaises(HTTPError) as ctx:
                urlopen(f'http://127.0.0.1:{port}/metrics', timeout=3)
            self.assertEqual(ctx.exception.code, 401)
            ctx.exception.close()

            wrong_req = Request(f'http://127.0.0.1:{port}/metrics', headers={'Authorization': 'Bearer wrong-token'})
            with self.assertRaises(HTTPError) as ctx_wrong:
                urlopen(wrong_req, timeout=3)
            self.assertEqual(ctx_wrong.exception.code, 401)
            ctx_wrong.exception.close()

            valid_req = Request(f'http://127.0.0.1:{port}/metrics', headers={'Authorization': f'Bearer {token}'})
            with urlopen(valid_req, timeout=5) as resp:
                self.assertEqual(resp.status, 200)
                self.assertIn('no-store', resp.headers.get('Cache-Control', ''))
                payload = json.loads(resp.read().decode('utf-8'))
                self.assertIn('host', payload)
                self.assertIn('memory', payload)
                self.assertIn('disk', payload)
                self.assertIn('health', payload)

            post_req = Request(f'http://127.0.0.1:{port}/metrics', method='POST', data=b'{}')
            with self.assertRaises(HTTPError) as ctx_post:
                urlopen(post_req, timeout=3)
            self.assertEqual(ctx_post.exception.code, 405)
            ctx_post.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


class VpsApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        clear_vps_cache()
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite://',
            'JWT_COOKIE_SECURE': False,
            'TRUSTED_PROXY_HOPS': 0,
            'SECURITY_STORE_PATH': str(Path(self.temp.name) / 'security.sqlite3'),
            'VPS_MONITOR_URL': '',
            'VPS_MONITOR_TOKEN': '',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        clear_vps_cache()
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
        self.temp.cleanup()

    def login_admin(self):
        user = User(username='admin', email='admin@example.com', role='admin')
        user.set_password('test-password-123')
        db.session.add(user)
        db.session.commit()
        return self.client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'test-password-123'})

    def test_vps_metrics_requires_admin(self):
        self.assertEqual(self.client.get('/api/vps/metrics').status_code, 401)
        token = create_access_token(identity='reader', additional_claims={'role': 'user'})
        self.client.set_cookie('admin_session', token)
        self.assertEqual(self.client.get('/api/vps/metrics').status_code, 403)

    def test_vps_metrics_unconfigured_or_invalid_scheme(self):
        self.login_admin()
        response = self.client.get('/api/vps/metrics')
        self.assertEqual(response.status_code, 503)
        self.assertIn('no-store', response.headers.get('Cache-Control', ''))

        self.app.config['VPS_MONITOR_URL'] = 'file:///etc/passwd'
        bad_scheme = self.client.get('/api/vps/metrics')
        self.assertEqual(bad_scheme.status_code, 503)

    def test_vps_metrics_proxies_agent_with_cache_and_fresh_bypass(self):
        self.login_admin()
        self.app.config['VPS_MONITOR_URL'] = 'http://127.0.0.1:9109/metrics'
        self.app.config['VPS_MONITOR_TOKEN'] = 'secret-vps-token'

        sample_payload = {
            'collected_at': '2026-11-21T01:05:00Z',
            'host': {'hostname': 'mars-project2727', 'cpu_cores': 2},
            'memory': {'total_bytes': 876609536, 'used_bytes': 440401920, 'used_pct': 50.2},
            'health': {'status': 'healthy', 'alerts': []},
        }

        class FakeResp:
            def __init__(self, body: bytes):
                self._body = body

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return self._body

        with patch('app.service.vps_service.urlopen', return_value=FakeResp(json.dumps(sample_payload).encode('utf-8'))) as mock_open:
            first = self.client.get('/api/vps/metrics')
            self.assertEqual(first.status_code, 200)
            self.assertEqual(first.json['data']['host']['hostname'], 'mars-project2727')
            self.assertIn('no-store', first.headers.get('Cache-Control', ''))
            req_sent = mock_open.call_args[0][0]
            self.assertEqual(req_sent.get_header('Authorization'), 'Bearer secret-vps-token')

            # Second call within 5s hits cache.
            second = self.client.get('/api/vps/metrics')
            self.assertEqual(second.status_code, 200)
            self.assertEqual(mock_open.call_count, 1)

            # ?fresh=1 bypasses cache.
            third = self.client.get('/api/vps/metrics?fresh=1')
            self.assertEqual(third.status_code, 200)
            self.assertEqual(mock_open.call_count, 2)

    def test_vps_metrics_hides_token_on_agent_failure(self):
        self.login_admin()
        secret = 'very-sensitive-token-value'
        self.app.config['VPS_MONITOR_URL'] = 'http://127.0.0.1:9109/metrics'
        self.app.config['VPS_MONITOR_TOKEN'] = secret

        with patch('app.service.vps_service.urlopen', side_effect=URLError('connection refused')):
            resp = self.client.get('/api/vps/metrics')
        self.assertEqual(resp.status_code, 503)
        self.assertNotIn(secret, resp.get_data(as_text=True))


if __name__ == '__main__':
    unittest.main()
