import io
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

os.environ['JWT_SECRET_KEY'] = 'isolated-test-secret-at-least-32-characters'
os.environ['FRONTEND_URL'] = 'http://localhost:3000'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest
from flask_jwt_extended import create_access_token
from app import create_app, db
from app.models.user import User
from app.models.message import Message
from app.utils.image_storage import save_validated_image, delete_stored_image
from app.utils.security import consume_limits


class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.app = create_app({
            'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite://',
            'JWT_COOKIE_SECURE': False, 'TRUSTED_PROXY_HOPS': 0,
            'SECURITY_STORE_PATH': str(Path(self.temp.name) / 'security.sqlite3'),
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
        self.temp.cleanup()

    def add_admin(self):
        user = User(username='admin', email='admin@example.com', role='admin')
        user.set_password('test-password-123')
        db.session.add(user)
        db.session.commit()

    def login(self):
        self.add_admin()
        return self.client.post('/api/auth/login', json={'email': 'admin@example.com', 'password': 'test-password-123'})

    def csrf(self):
        return {'X-CSRF-TOKEN': self.client.get_cookie('csrf_access_token').value}

    def test_anonymous_cannot_bootstrap_even_with_empty_database(self):
        response = self.client.post('/api/auth/register', json={'username': 'intruder', 'email': 'x@example.com', 'password': 'long-password'})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(User.query.count(), 0)

    def test_cli_bootstrap_is_local_and_one_time(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(args=['create-admin', '--username', 'admin', '--email', 'admin@example.com'], input='test-password-123\ntest-password-123\n')
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(User.query.one().role, 'admin')
        result = runner.invoke(args=['create-admin', '--username', 'other', '--email', 'other@example.com'], input='test-password-123\ntest-password-123\n')
        self.assertNotEqual(result.exit_code, 0)
        self.assertEqual(User.query.count(), 1)

    def test_login_uses_secure_httponly_cookie_and_no_json_token(self):
        self.app.config['JWT_COOKIE_SECURE'] = True
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('access_token', response.json)
        cookie = next(value for value in response.headers.getlist('Set-Cookie') if value.startswith('admin_session='))
        self.assertIn('HttpOnly', cookie)
        self.assertIn('Secure', cookie)
        self.assertIn('SameSite=Lax', cookie)
        self.assertIn('Max-Age=28800', cookie)
        self.assertIn('no-store', response.headers['Cache-Control'])

    def test_cookie_lifetime_matches_configured_token_lifetime(self):
        from datetime import timedelta
        self.app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)
        response = self.login()
        cookie = next(value for value in response.headers.getlist('Set-Cookie') if value.startswith('admin_session='))
        self.assertIn('Max-Age=7200', cookie)

    def test_mutation_requires_csrf_and_logout_revokes_copied_token(self):
        self.login()
        token = self.client.get_cookie('admin_session').value
        csrf = self.csrf()
        self.assertEqual(self.client.post('/api/auth/logout').status_code, 401)
        self.assertEqual(self.client.get('/api/messages/').status_code, 200)
        self.assertEqual(self.client.post('/api/auth/logout', headers=csrf).status_code, 200)
        self.assertIsNone(self.client.get_cookie('admin_session'))
        self.client.set_cookie('admin_session', token)
        self.assertEqual(self.client.get('/api/messages/').status_code, 401)

    def test_admin_can_register_with_csrf(self):
        self.login()
        response = self.client.post('/api/auth/register', headers=self.csrf(), json={
            'username': 'reader', 'email': 'reader@example.com', 'password': 'test-password-456'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.query.filter_by(username='reader').one().role, 'user')

    def test_non_admin_cannot_read_messages(self):
        token = create_access_token(identity='reader', additional_claims={'role': 'user'})
        self.client.set_cookie('admin_session', token)
        self.assertEqual(self.client.get('/api/messages/').status_code, 403)

    def test_login_throttles_account_across_different_ips(self):
        for index in range(10):
            response = self.client.post('/api/auth/login', json={'email': 'target@example.com', 'password': 'wrong'}, environ_base={'REMOTE_ADDR': f'192.0.2.{index}'})
            self.assertEqual(response.status_code, 401)
        response = self.client.post('/api/auth/login', json={'email': ' TARGET@example.com ', 'password': 'wrong'}, environ_base={'REMOTE_ADDR': '192.0.2.99'})
        self.assertEqual(response.status_code, 429)
        self.assertGreater(int(response.headers['Retry-After']), 0)

    def test_cross_origin_login_rejected(self):
        response = self.client.post('/api/auth/login', headers={'Origin': 'https://untrusted.example'}, json={'email': 'a@b.com', 'password': 'secret'})
        self.assertEqual(response.status_code, 403)

    def test_malformed_login_and_contact_json(self):
        for path in ['/api/auth/login', '/api/messages/']:
            for data in [['unexpected'], {'email': 123, 'password': [], 'name': {}, 'content': 3}]:
                self.assertEqual(self.client.post(path, json=data).status_code, 400)

    @patch('app.service.push_service.broadcast_push_to_admin')
    def test_contact_saved_once_per_allowed_request_and_limited(self, push):
        message = {'name': 'Visitor', 'email': 'visitor@example.com', 'content': 'Hello'}
        for _ in range(5):
            self.assertEqual(self.client.post('/api/messages/', json=message).status_code, 201)
        self.assertEqual(self.client.post('/api/messages/', json=message).status_code, 429)
        self.assertEqual(Message.query.count(), 5)
        self.assertEqual(push.call_count, 5)

    def test_limiter_shared_by_connections_and_recovers_after_window(self):
        rules = [('example', 1, 60)]
        self.assertEqual(consume_limits(rules, now=100), 0)
        self.assertEqual(consume_limits(rules, now=101), 59)
        self.assertEqual(consume_limits(rules, now=161), 0)

    def test_health_and_authenticated_reads_not_cached(self):
        self.assertEqual(self.client.get('/api/health').status_code, 200)
        self.login()
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('no-store', response.headers['Cache-Control'])

    def test_health_failure_is_generic(self):
        with patch.object(db.session, 'execute', side_effect=RuntimeError('private database details')):
            response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('private', response.get_data(as_text=True))

    def test_project_upload_requires_csrf_and_rejects_fake_image(self):
        self.login()
        data = {'title': 'Test project', 'description': 'Description', 'image': (io.BytesIO(b'fake'), 'image.png')}
        response = self.client.post('/api/projects/', data=data)
        self.assertEqual(response.status_code, 401)
        data['image'] = (io.BytesIO(b'fake'), 'image.png')
        response = self.client.post('/api/projects/', data=data, headers=self.csrf())
        self.assertEqual(response.status_code, 400)
        self.assertTrue(response.is_json)
        self.assertIn('Gambar rusak', response.json['message'])

    def test_global_request_size_limit_returns_json(self):
        self.app.config['MAX_CONTENT_LENGTH'] = 64
        response = self.client.post('/api/messages/', json={'name': 'Visitor', 'email': 'visitor@example.com', 'content': 'x' * 100})
        self.assertEqual(response.status_code, 413)
        self.assertTrue(response.is_json)

    def test_image_rejects_fake_mismatched_large_and_oversized_dimensions(self):
        folder = str(Path(self.temp.name) / 'projects')
        stream = io.BytesIO()
        Image.new('RGB', (10, 10)).save(stream, format='PNG')
        cases = [(b'<script>bad</script>', 'fake.png'), (stream.getvalue(), 'mismatch.jpg'), (b'x' * (5 * 1024 * 1024 + 1), 'large.png')]
        for payload, name in cases:
            with self.assertRaises(BadRequest):
                save_validated_image(FileStorage(stream=io.BytesIO(payload), filename=name), folder, {'png', 'jpg'})
        with patch('app.utils.image_storage.MAX_PIXELS', 50), self.assertRaises(BadRequest):
            save_validated_image(FileStorage(stream=io.BytesIO(stream.getvalue()), filename='large.png'), folder, {'png'})
        self.assertFalse(Path(folder).exists())

    def test_image_reencoding_and_path_safe_delete(self):
        folder = Path(self.temp.name) / 'projects'
        stream = io.BytesIO()
        Image.new('RGB', (10, 10)).save(stream, format='PNG')
        url = save_validated_image(FileStorage(stream=io.BytesIO(stream.getvalue() + b'UNTRUSTED_TRAILER'), filename='image.png'), str(folder), {'png'})
        image_path = folder / url.rsplit('/', 1)[-1]
        self.assertNotIn(b'UNTRUSTED_TRAILER', image_path.read_bytes())
        outside = Path(self.temp.name) / 'keep.txt'
        outside.write_text('keep')
        delete_stored_image('/static/uploads/projects/../keep.txt', str(folder))
        self.assertTrue(outside.exists())
        delete_stored_image(url, str(folder))
        self.assertFalse(image_path.exists())


if __name__ == '__main__':
    unittest.main()
