import os
from flask import Flask, request
from .config import Config,db_connection
from  flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
     app = Flask(__name__)

     frontend_origins = [url.strip() for url in os.getenv('FRONTEND_URL', 'http://localhost:3000').split(',')]
     CORS(app,
          origins=frontend_origins,
          supports_credentials=True,
          allow_headers=["Content-Type", "Authorization"],
          methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])

     app.config.from_object(Config)
     app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000
     #fungsi ini di panggil untuk test koneksi data base
     db_connection()

     db.init_app(app)
     migrate.init_app(app, db)
     jwt.init_app(app)

     @app.after_request
     def prevent_sensitive_response_caching(response):
          is_sensitive_path = request.path.startswith(('/api/auth', '/api/messages'))
          is_authenticated = bool(request.headers.get('Authorization'))
          is_mutation = request.method not in ('GET', 'HEAD', 'OPTIONS')

          if is_sensitive_path or is_authenticated or is_mutation:
               response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
               response.headers['Pragma'] = 'no-cache'
               response.headers['Expires'] = '0'

          return response

     from .models.project import Project
     from .models.user import User
     from .models.skill import Skill
     from .models.message import Message
     from .models.project_image import ProjectImage
     from .models.push_subscription import PushSubscription
     from .models.about_profile import AboutProfile

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

     return app
