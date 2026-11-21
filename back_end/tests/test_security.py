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
from flask_jwt_extended import create_access_token, get_csrf_token
from app import create_app, db
from app.models.user import User
from app.models.message import Message
from app.models.site_content import SiteContent
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


    def test_project_migration_preserves_existing_rows(self):
        import importlib.util
        import sqlalchemy as sa
        from alembic.migration import MigrationContext
        from alembic.operations import Operations
        migration_path = Path(__file__).resolve().parents[1] / 'migrations/versions/a3b5c7d9e1f2_featured_projects_and_video.py'
        spec = importlib.util.spec_from_file_location('project_migration', migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        engine = sa.create_engine('sqlite://')
        with engine.begin() as connection:
            connection.execute(sa.text('CREATE TABLE projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL)'))
            connection.execute(sa.text("INSERT INTO projects (id, title) VALUES (1, 'Existing')"))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                migration.upgrade()
                row = connection.execute(sa.text('SELECT title, is_featured, sort_order, video_url FROM projects')).one()
                self.assertEqual(tuple(row), ('Existing', 0, 0, None))
                migration.downgrade()
            self.assertEqual([column['name'] for column in sa.inspect(connection).get_columns('projects')], ['id', 'title'])
        engine.dispose()

    def test_project_featured_order_and_video_round_trip(self):
        self.login()
        with patch('app.routes.project_routes.save_image', return_value='/static/uploads/projects/test.png'):
            for title, order, featured in [('Later', '20', 'false'), ('Featured', '1', 'true')]:
                response = self.client.post('/api/projects/', headers=self.csrf(), data={
                    'title': title, 'description': 'Demo project', 'sort_order': order,
                    'is_featured': featured, 'video_url': 'https://youtu.be/abcdefghijk',
                    'image': (io.BytesIO(b'test'), 'test.png'),
                })
                self.assertEqual(response.status_code, 201, response.json)
        projects = self.client.get('/api/projects/').json['data']
        self.assertEqual([item['title'] for item in projects], ['Featured', 'Later'])
        featured = projects[0]
        self.assertTrue(featured['is_featured'])
        self.assertEqual(featured['sort_order'], 1)
        self.assertEqual(featured['video_url'], 'https://youtu.be/abcdefghijk')
        response = self.client.put(f"/api/projects/{featured['id']}", headers=self.csrf(), data={
            'is_featured': 'false', 'sort_order': '30', 'video_url': '',
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json['data']['is_featured'])
        self.assertIsNone(response.json['data']['video_url'])

    def test_project_rejects_invalid_presentation_fields(self):
        self.login()
        for fields in ({'is_featured': 'yes'}, {'sort_order': '-1'}, {'sort_order': '1.5'}, {'video_url': 'javascript:alert(1)'}):
            response = self.client.post('/api/projects/', headers=self.csrf(), data={
                'title': 'Test', 'description': 'Test', **fields,
            })
            self.assertEqual(response.status_code, 400, fields)

    def test_cv_upload_update_and_replacement(self):
        self.login()
        cv_folder = Path(self.temp.name) / 'cv'
        fields = {'full_name': 'Marshel', 'headline': 'Engineer', 'bio': 'Profile'}
        with patch('app.utils.cv_upload.UPLOAD_FOLDER', str(cv_folder)):
            response = self.client.put('/api/about/', headers=self.csrf(), data={
                **fields, 'cv_file': (io.BytesIO(b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'), '../../resume.pdf'),
            })
            self.assertEqual(response.status_code, 200, response.json)
            url = response.json['data']['cv_url']
            self.assertTrue(url.startswith('/static/uploads/cv/'))
            uploaded = cv_folder / url.rsplit('/', 1)[-1]
            self.assertTrue(uploaded.is_file())
            response = self.client.put('/api/about/', headers=self.csrf(), data={**fields, 'cv_url': url})
            self.assertEqual(response.status_code, 200, response.json)
            self.assertTrue(uploaded.exists())
            response = self.client.put('/api/about/', headers=self.csrf(), data={**fields, 'cv_url': 'https://example.com/resume.pdf'})
            self.assertEqual(response.status_code, 200, response.json)
            self.assertFalse(uploaded.exists())

    def test_cv_rejects_invalid_uploads_and_requires_admin(self):
        fields = {'full_name': 'Marshel', 'headline': 'Engineer', 'bio': 'Profile'}
        response = self.client.put('/api/about/', data=fields)
        self.assertEqual(response.status_code, 401)
        self.login()
        with patch('app.utils.cv_upload.UPLOAD_FOLDER', str(Path(self.temp.name) / 'cv')):
            for payload, filename in [(b'fake pdf', 'cv.pdf'), (b'%PDF-1.4\n%%EOF', 'cv.html')]:
                response = self.client.put('/api/about/', headers=self.csrf(), data={
                    **fields, 'cv_file': (io.BytesIO(payload), filename),
                })
                self.assertEqual(response.status_code, 400, response.json)
            with patch('app.utils.cv_upload.MAX_CV_BYTES', 10):
                response = self.client.put('/api/about/', headers=self.csrf(), data={
                    **fields, 'cv_file': (io.BytesIO(b'%PDF-1.4\n' + b'x' * 20 + b'\n%%EOF'), 'cv.pdf'),
                })
                self.assertEqual(response.status_code, 400)

    def test_new_cms_controls_survive_save(self):
        self.login()
        content = self.client.get('/api/site-content/').json['data']['content']
        content['global']['social_links'] = [{'label': 'Email', 'href': 'mailto:test@example.com'}]
        content['home']['selected_project_count'] = 4
        content['skills']['milestones'] = [{'period': '2026', 'role': 'Engineer', 'description': 'Testing'}]
        content['resume']['fallback_cv_url'] = 'https://example.com/resume.pdf'
        response = self.client.put('/api/site-content/', headers=self.csrf(), json={'content': content})
        self.assertEqual(response.status_code, 200, response.json)
        saved = self.client.get('/api/site-content/').json['data']['content']
        self.assertEqual(saved['home']['selected_project_count'], 4)
        self.assertEqual(saved['global']['social_links'], content['global']['social_links'])
        self.assertEqual(saved['skills']['milestones'], content['skills']['milestones'])
        self.assertEqual(saved['resume']['fallback_cv_url'], content['resume']['fallback_cv_url'])

    def _image_bytes(self, image_format='PNG'):
        stream = io.BytesIO()
        Image.new('RGB', (10, 10)).save(stream, format=image_format)
        return stream.getvalue()

    def _pdf_bytes(self, body=b'1 0 obj\n<<>>\nendobj\n'):
        return b'%PDF-1.4\n' + body + b'%%EOF'

    def test_certificate_auth_csrf_and_role_rejection(self):
        cert_folder = str(Path(self.temp.name) / 'certificates')
        with patch('app.utils.certificate_upload.UPLOAD_FOLDER', cert_folder):
            public_list = self.client.get('/api/certificates/')
            self.assertEqual(public_list.status_code, 200)
            self.assertEqual(public_list.json['data'], [])
            self.assertIn('public', public_list.headers['Cache-Control'])
            self.assertEqual(self.client.get('/api/certificates/999').status_code, 404)

            payload = {
                'title': 'Cloud Architect',
                'issuer': 'Provider',
                'file': (io.BytesIO(self._image_bytes()), 'cert.png'),
            }
            self.assertEqual(self.client.post('/api/certificates/', data=payload).status_code, 401)
            self.assertEqual(self.client.put('/api/certificates/1', data={'title': 'Updated'}).status_code, 401)
            self.assertEqual(self.client.delete('/api/certificates/1').status_code, 401)

            user_token = create_access_token(identity='reader', additional_claims={'role': 'user'})
            user_csrf = {'X-CSRF-TOKEN': get_csrf_token(user_token)}
            self.client.set_cookie('admin_session', user_token)
            self.assertEqual(
                self.client.post(
                    '/api/certificates/',
                    headers=user_csrf,
                    data={'title': 'Cloud', 'issuer': 'Provider', 'file': (io.BytesIO(self._image_bytes()), 'cert.png')},
                ).status_code,
                403,
            )
            self.assertEqual(
                self.client.put('/api/certificates/1', headers=user_csrf, data={'title': 'Updated'}).status_code,
                403,
            )
            self.assertEqual(self.client.delete('/api/certificates/1', headers=user_csrf).status_code, 403)

            self.login()
            self.assertEqual(
                self.client.post(
                    '/api/certificates/',
                    data={'title': 'Cloud', 'issuer': 'Provider', 'file': (io.BytesIO(self._image_bytes()), 'cert.png')},
                ).status_code,
                401,
            )
            self.assertEqual(self.client.put('/api/certificates/1', data={'title': 'Updated'}).status_code, 401)
            self.assertEqual(self.client.delete('/api/certificates/1').status_code, 401)

    def test_certificate_create_png_webp_and_pdf_with_defaults(self):
        self.login()
        cert_folder = Path(self.temp.name) / 'certificates'
        with patch('app.utils.certificate_upload.UPLOAD_FOLDER', str(cert_folder)):
            png_res = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={
                    'title': 'Full-Stack Foundations',
                    'issuer': 'Dicoding',
                    'category': '   ',
                    'issue_date': '',
                    'credential_id': '',
                    'credential_url': '',
                    'description': '',
                    'file': (io.BytesIO(self._image_bytes('PNG') + b'UNTRUSTED_TRAILER'), 'cert.png'),
                },
            )
            self.assertEqual(png_res.status_code, 201, png_res.json)
            png_data = png_res.json['data']
            self.assertEqual(png_data['file_type'], 'image')
            self.assertEqual(png_data['category'], 'Lainnya')
            self.assertIsNone(png_data['issue_date'])
            self.assertIsNone(png_data['credential_id'])
            self.assertIsNone(png_data['credential_url'])
            self.assertIsNone(png_data['description'])
            self.assertFalse(png_data['is_featured'])
            self.assertEqual(png_data['display_order'], 0)
            self.assertTrue(png_data['file_url'].startswith('/static/uploads/certificates/'))
            self.assertIsNotNone(png_data['created_at'])
            self.assertIsNotNone(png_data['updated_at'])
            stored_png = cert_folder / png_data['file_url'].rsplit('/', 1)[-1]
            self.assertTrue(stored_png.is_file())
            self.assertNotIn(b'UNTRUSTED_TRAILER', stored_png.read_bytes())

            webp_res = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={
                    'title': 'WebP Cert',
                    'issuer': 'Cloud Org',
                    'file': (io.BytesIO(self._image_bytes('WEBP')), 'cert.webp'),
                },
            )
            self.assertEqual(webp_res.status_code, 201, webp_res.json)
            self.assertEqual(webp_res.json['data']['file_type'], 'image')

            pdf_res = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={
                    'title': 'AWS Certified Developer',
                    'issuer': 'AWS',
                    'issue_date': 'Agu 2026',
                    'category': 'Cloud & Backend',
                    'credential_id': 'AWS-12345',
                    'credential_url': 'https://verify.example.com/aws-12345',
                    'description': 'Sertifikasi cloud architecture & serverless.',
                    'is_featured': '1',
                    'display_order': '5',
                    'file': (io.BytesIO(self._pdf_bytes()), '../../aws.PDF'),
                },
            )
            self.assertEqual(pdf_res.status_code, 201, pdf_res.json)
            pdf_data = pdf_res.json['data']
            self.assertEqual(pdf_data['file_type'], 'pdf')
            self.assertTrue(pdf_data['file_url'].startswith('/static/uploads/certificates/'))
            self.assertTrue(pdf_data['file_url'].endswith('.pdf'))
            self.assertTrue(pdf_data['is_featured'])
            self.assertEqual(pdf_data['display_order'], 5)
            self.assertEqual(pdf_data['credential_url'], 'https://verify.example.com/aws-12345')
            self.assertTrue((cert_folder / pdf_data['file_url'].rsplit('/', 1)[-1]).is_file())

            detail_res = self.client.get(f"/api/certificates/{pdf_data['id']}")
            self.assertEqual(detail_res.status_code, 200)
            self.assertEqual(detail_res.json['data']['title'], 'AWS Certified Developer')

    def test_certificate_ordering_featured_display_order_and_id_desc(self):
        self.login()
        cert_folder = str(Path(self.temp.name) / 'certificates')
        with patch('app.utils.certificate_upload.UPLOAD_FOLDER', cert_folder):
            specs = [
                ('Regular Older', 'false', '1'),
                ('Regular Newer', 'false', '1'),
                ('Featured Order 10', 'true', '10'),
                ('Featured Order 2', 'true', '2'),
            ]
            for title, featured, order in specs:
                res = self.client.post(
                    '/api/certificates/',
                    headers=self.csrf(),
                    data={
                        'title': title,
                        'issuer': 'Issuer',
                        'is_featured': featured,
                        'display_order': order,
                        'file': (io.BytesIO(self._image_bytes('PNG')), 'cert.png'),
                    },
                )
                self.assertEqual(res.status_code, 201, res.json)

        items = self.client.get('/api/certificates/').json['data']
        self.assertEqual(
            [item['title'] for item in items],
            ['Featured Order 2', 'Featured Order 10', 'Regular Newer', 'Regular Older'],
        )

    def test_certificate_update_replace_file_and_delete(self):
        self.login()
        cert_folder = Path(self.temp.name) / 'certificates'
        with patch('app.utils.certificate_upload.UPLOAD_FOLDER', str(cert_folder)):
            created = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={
                    'title': 'Initial Cert',
                    'issuer': 'Initial Issuer',
                    'category': 'Web Development',
                    'credential_url': 'https://example.com/verify/1',
                    'file': (io.BytesIO(self._image_bytes('PNG')), 'initial.png'),
                },
            ).json['data']
            old_path = cert_folder / created['file_url'].rsplit('/', 1)[-1]
            self.assertTrue(old_path.is_file())

            meta_update = self.client.put(
                f"/api/certificates/{created['id']}",
                headers=self.csrf(),
                data={
                    'title': 'Updated Cert',
                    'category': '',
                    'credential_url': '',
                    'is_featured': 'true',
                    'display_order': '3',
                },
            )
            self.assertEqual(meta_update.status_code, 200, meta_update.json)
            meta_data = meta_update.json['data']
            self.assertEqual(meta_data['title'], 'Updated Cert')
            self.assertEqual(meta_data['issuer'], 'Initial Issuer')
            self.assertEqual(meta_data['category'], 'Lainnya')
            self.assertIsNone(meta_data['credential_url'])
            self.assertTrue(meta_data['is_featured'])
            self.assertEqual(meta_data['display_order'], 3)
            self.assertEqual(meta_data['file_url'], created['file_url'])
            self.assertTrue(old_path.is_file())

            replace_res = self.client.put(
                f"/api/certificates/{created['id']}",
                headers=self.csrf(),
                data={'file': (io.BytesIO(self._pdf_bytes()), 'replacement.pdf')},
            )
            self.assertEqual(replace_res.status_code, 200, replace_res.json)
            replaced = replace_res.json['data']
            new_path = cert_folder / replaced['file_url'].rsplit('/', 1)[-1]
            self.assertEqual(replaced['file_type'], 'pdf')
            self.assertNotEqual(replaced['file_url'], created['file_url'])
            self.assertFalse(old_path.exists())
            self.assertTrue(new_path.is_file())

            with patch('app.routes.certificate_routes.update_certificate', side_effect=RuntimeError('db fail')):
                with self.assertRaises(RuntimeError):
                    self.client.put(
                        f"/api/certificates/{created['id']}",
                        headers=self.csrf(),
                        data={'file': (io.BytesIO(self._image_bytes('PNG')), 'orphan.png')},
                    )
            self.assertTrue(new_path.is_file())
            self.assertEqual(len(list(cert_folder.iterdir())), 1)

            self.assertEqual(
                self.client.put('/api/certificates/9999', headers=self.csrf(), data={'title': 'Missing'}).status_code,
                404,
            )

            del_res = self.client.delete(f"/api/certificates/{created['id']}", headers=self.csrf())
            self.assertEqual(del_res.status_code, 200)
            self.assertFalse(new_path.exists())
            self.assertEqual(self.client.get(f"/api/certificates/{created['id']}").status_code, 404)
            self.assertEqual(self.client.delete('/api/certificates/9999', headers=self.csrf()).status_code, 404)

    def test_certificate_rejects_invalid_uploads_and_fields(self):
        self.login()
        cert_folder = Path(self.temp.name) / 'certificates'
        with patch('app.utils.certificate_upload.UPLOAD_FOLDER', str(cert_folder)):
            missing_file = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={'title': 'No File', 'issuer': 'Issuer'},
            )
            self.assertEqual(missing_file.status_code, 400)

            bad_files = [
                (b'<script>bad</script>', 'fake.png'),
                (self._image_bytes('PNG'), 'mismatch.jpg'),
                (b'not a pdf', 'fake.pdf'),
                (b'%PDF-1.4\nno eof marker', 'incomplete.pdf'),
                (b'<svg></svg>', 'vector.svg'),
            ]
            for payload, filename in bad_files:
                res = self.client.post(
                    '/api/certificates/',
                    headers=self.csrf(),
                    data={'title': 'Cert', 'issuer': 'Issuer', 'file': (io.BytesIO(payload), filename)},
                )
                self.assertEqual(res.status_code, 400, (filename, res.json))

            with patch('app.utils.certificate_upload.MAX_PDF_BYTES', 10):
                oversized = self.client.post(
                    '/api/certificates/',
                    headers=self.csrf(),
                    data={
                        'title': 'Large PDF',
                        'issuer': 'Issuer',
                        'file': (io.BytesIO(self._pdf_bytes(b'x' * 30)), 'big.pdf'),
                    },
                )
                self.assertEqual(oversized.status_code, 400)

            bad_fields = [
                {'title': '   ', 'issuer': 'Issuer'},
                {'title': 'x' * 201, 'issuer': 'Issuer'},
                {'title': 'Cert', 'issuer': ''},
                {'title': 'Cert', 'issuer': 'x' * 151},
                {'title': 'Cert', 'issuer': 'Issuer', 'credential_url': 'javascript:alert(1)'},
                {'title': 'Cert', 'issuer': 'Issuer', 'credential_url': 'ftp://example.com/cert'},
                {'title': 'Cert', 'issuer': 'Issuer', 'credential_url': 'not-a-url'},
                {'title': 'Cert', 'issuer': 'Issuer', 'credential_url': 'https://example.com/' + 'a' * 500},
                {'title': 'Cert', 'issuer': 'Issuer', 'is_featured': 'yes'},
                {'title': 'Cert', 'issuer': 'Issuer', 'display_order': '-1'},
                {'title': 'Cert', 'issuer': 'Issuer', 'display_order': '10000'},
                {'title': 'Cert', 'issuer': 'Issuer', 'display_order': '1.5'},
            ]
            for fields in bad_fields:
                res = self.client.post(
                    '/api/certificates/',
                    headers=self.csrf(),
                    data={**fields, 'file': (io.BytesIO(self._image_bytes('PNG')), 'cert.png')},
                )
                self.assertEqual(res.status_code, 400, fields)

            created = self.client.post(
                '/api/certificates/',
                headers=self.csrf(),
                data={'title': 'Valid', 'issuer': 'Issuer', 'file': (io.BytesIO(self._image_bytes('PNG')), 'cert.png')},
            ).json['data']
            stored_file = cert_folder / created['file_url'].rsplit('/', 1)[-1]
            for bad_put in ({'title': '  '}, {'issuer': ''}, {'credential_url': 'javascript:alert(1)'}):
                res = self.client.put(f"/api/certificates/{created['id']}", headers=self.csrf(), data=bad_put)
                self.assertEqual(res.status_code, 400, bad_put)
                self.assertTrue(stored_file.exists())

    def test_certificate_migration_is_idempotent(self):
        import importlib.util
        import sqlalchemy as sa
        from alembic.migration import MigrationContext
        from alembic.operations import Operations

        migration_path = Path(__file__).resolve().parents[1] / 'migrations/versions/c9d8e7f6a5b4_add_certificates_table.py'
        spec = importlib.util.spec_from_file_location('certificate_migration', migration_path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)

        self.assertEqual(migration.revision, 'c9d8e7f6a5b4')
        self.assertEqual(migration.down_revision, 'a3b5c7d9e1f2')

        engine = sa.create_engine('sqlite://')
        with engine.begin() as connection:
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                migration.upgrade()
                inspector = sa.inspect(connection)
                self.assertTrue(inspector.has_table('certificates'))
                columns = {column['name'] for column in inspector.get_columns('certificates')}
                self.assertEqual(
                    columns,
                    {
                        'id', 'title', 'issuer', 'issue_date', 'category',
                        'credential_id', 'credential_url', 'description',
                        'file_url', 'file_type', 'is_featured', 'display_order',
                        'created_at', 'updated_at',
                    },
                )
                connection.execute(
                    sa.text("INSERT INTO certificates (title, issuer, file_url) VALUES ('Cert', 'Issuer', '/static/uploads/certificates/a.png')")
                )
                row = connection.execute(
                    sa.text('SELECT category, file_type, is_featured, display_order FROM certificates')
                ).one()
                self.assertEqual(tuple(row), ('Lainnya', 'image', 0, 0))
                migration.downgrade()
                migration.downgrade()
                self.assertFalse(sa.inspect(connection).has_table('certificates'))
        engine.dispose()

    def test_site_content_includes_certificates_defaults_and_injects_nav_link(self):
        default_res = self.client.get('/api/site-content/')
        self.assertEqual(default_res.status_code, 200)
        default_content = default_res.json['data']['content']
        self.assertIn('certificates', default_content)
        self.assertEqual(
            [item['href'] for item in default_content['global']['nav_links']],
            ['/', '/skills', '/projects', '/certificates', '/contact'],
        )
        for key in (
            'hero_eyebrow', 'hero_title', 'hero_description', 'filter_label',
            'search_placeholder', 'all_category_label', 'index_eyebrow',
            'index_title', 'displayed_suffix', 'verify_action_label',
            'preview_action_label',
        ):
            self.assertIn(key, default_content['certificates'])

        db.session.add(SiteContent(id=1, content={
            'global': {
                'nav_links': [
                    {'label': 'Beranda', 'href': '/'},
                    {'label': 'Project', 'href': '/projects'},
                    {'label': 'Kontak', 'href': '/contact'},
                ],
            },
        }))
        db.session.commit()

        legacy_res = self.client.get('/api/site-content/')
        self.assertEqual(legacy_res.status_code, 200)
        nav_links = legacy_res.json['data']['content']['global']['nav_links']
        self.assertEqual(
            [item['href'] for item in nav_links],
            ['/', '/projects', '/certificates', '/contact'],
        )
        self.assertEqual(nav_links[2], {'label': 'Sertifikat', 'href': '/certificates'})


if __name__ == '__main__':
    unittest.main()
