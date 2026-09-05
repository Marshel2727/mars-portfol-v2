import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt, jwt_required, set_access_cookies, unset_jwt_cookies
from app.service.auth_service import register_user, verify_login
from app.utils.security import rate_limit, revoke_token

auth_bp = Blueprint('auth_bp', __name__, url_prefix=('/api/auth'))

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    if get_jwt().get('role') != 'admin':
        return jsonify(status='error', message='Hanya admin yang bisa membuat akun.'), 403
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not all(isinstance(data.get(key), str) and data[key].strip() for key in ('username', 'email', 'password')):
        return jsonify({
            "status": "error",
            "message": "Semua kolom (username, email, password) wajib diisi!"
        }), 400

    if not 12 <= len(data['password']) <= 128:
        return jsonify({
            "status": "error",
            "message": "Password harus 12 sampai 128 karakter."
        }), 400

    if len(data['username']) > 255 or len(data['email']) > 255 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', data['email'].strip()):
        return jsonify(status='error', message='Username atau email tidak valid.'), 400

    requested_role = data.get('role', 'user')
    if requested_role not in ('user', 'admin'):
        return jsonify({
            "status": "error",
            "message": "Role harus berupa user atau admin."
        }), 400

    response_data, status_code = register_user(data, role=requested_role)
    return jsonify(response_data), status_code

@auth_bp.route('/login', methods=['POST'])
@rate_limit('login')
def login():
    origin = request.headers.get('Origin')
    if origin and origin not in current_app.config['LOGIN_ALLOWED_ORIGINS']:
        return jsonify(status='error', message='Origin tidak diizinkan.'), 403
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not all(isinstance(data.get(key), str) and data[key] for key in ('email', 'password')):
        return jsonify({
            "status": "error",
            "message": "Semua kolom (email, password) wajib diisi!"
        }), 400

    if len(data['email']) > 255 or len(data['password']) > 128:
        return jsonify(status='error', message='Email atau password tidak valid.'), 400
    response_data, status_code = verify_login(data['email'], data['password'])
    token = response_data.pop('access_token', None)
    response = jsonify(response_data)
    if token:
        set_access_cookies(response, token, max_age=int(current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()))
        response.delete_cookie('access_token')
    return response, status_code


@auth_bp.post('/logout')
@jwt_required()
def logout():
    revoke_token(get_jwt())
    response = jsonify(status='success', message='Logout berhasil.')
    unset_jwt_cookies(response)
    return response

@auth_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    from flask_jwt_extended import get_jwt_identity
    from app.service.auth_service import subscribe_push

    if get_jwt().get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Akses ditolak! Hanya admin yang dapat menerima notifikasi."
        }), 403

    user_id = get_jwt_identity()
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({
            "status": "error",
            "message": "Data subscription wajib disertakan!"
        }), 400

    response_data, status_code = subscribe_push(user_id, data)
    return jsonify(response_data), status_code
