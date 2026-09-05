import os
from flask import Flask, request, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy import text
from .config import Config,db_connection
from  flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(test_config=None):
     app = Flask(__name__)
     # Accept both /resource and /resource/ so reverse proxies never emit
     # redirects that expose an internal Docker hostname.
     app.url_map.strict_slashes = False

     frontend_origins = [url.strip() for url in os.getenv('FRONTEND_URL', 'http://localhost:3000').split(',')]
     CORS(app,
          origins=frontend_origins,
          supports_credentials=True,
          allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
          methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])

     app.config.from_object(Config)
     if test_config:
          app.config.update(test_config)
     app.config['LOGIN_ALLOWED_ORIGINS'] = frontend_origins
     if app.config['TRUSTED_PROXY_HOPS']:
          app.wsgi_app = ProxyFix(app.wsgi_app, x_for=app.config['TRUSTED_PROXY_HOPS'])
     app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000
     #fungsi ini di panggil untuk test koneksi data base
     if not app.testing:
          db_connection()

     db.init_app(app)
     migrate.init_app(app, db)
     jwt.init_app(app)
     from .utils.security import token_revoked
     jwt.token_in_blocklist_loader(token_revoked)

     @app.errorhandler(413)
     def upload_too_large(_error):
          return jsonify(status='error', message='Ukuran permintaan maksimal 20 MB.'), 413

     @app.get('/api/health')
     def health():
          try:
               db.session.execute(text('SELECT 1'))
               return jsonify(status='ok')
          except Exception:
               db.session.rollback()
               app.logger.exception('Database health check failed')
               return jsonify(status='unavailable'), 503

     @app.errorhandler(400)
     def bad_request(error):
          return jsonify(status='error', message=error.description), 400

     @app.after_request
     def prevent_sensitive_response_caching(response):
          is_sensitive_path = request.path.startswith(('/api/auth', '/api/messages', '/api/health'))
          is_authenticated = bool(request.headers.get('Authorization') or request.cookies.get('admin_session'))
          is_mutation = request.method not in ('GET', 'HEAD', 'OPTIONS')

          if is_sensitive_path or is_authenticated or is_mutation:
               response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
               response.headers['Pragma'] = 'no-cache'
               response.headers['Expires'] = '0'

          response.headers['X-Content-Type-Options'] = 'nosniff'
          response.vary.add('Cookie')
          response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
          return response

     from .models.project import Project
     from .models.user import User
     from .models.skill import Skill
     from .models.message import Message
     from .models.project_image import ProjectImage
     from .models.push_subscription import PushSubscription
     from .models.about_profile import AboutProfile
     from .models.site_content import SiteContent

     from .routes.project_routes import project_bp
     app.register_blueprint(project_bp)
     
     from .routes.auth_routes import auth_bp
     app.register_blueprint(auth_bp)

     from .routes.skill_routes import skill_bp
     app.register_blueprint(skill_bp)

     from .routes.message_routes import message_bp
     app.register_blueprint(message_bp)

     from .routes.project_image_routes import project_image_bp
     app.register_blueprint(project_image_bp)

     from .routes.about_routes import about_bp
     app.register_blueprint(about_bp)

     from .routes.site_content_routes import site_content_bp
     app.register_blueprint(site_content_bp)

     from .cli import create_admin
     app.cli.add_command(create_admin)
     return app
