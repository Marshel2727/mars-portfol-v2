from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt, jwt_required, verify_jwt_in_request
from app.service.auth_service import has_registered_users, register_user, verify_login

auth_bp = Blueprint('auth_bp', __name__, url_prefix=('/api/auth'))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "error",
            "message": "Semua kolom (username, email, password) wajib diisi!"
        }), 400

    if len(data.get('password', '')) < 8:
        return jsonify({
            "status": "error",
            "message": "Password minimal 8 karakter."
        }), 400

    is_bootstrap = not has_registered_users()
    if not is_bootstrap:
        verify_jwt_in_request()
        if get_jwt().get('role') != 'admin':
            return jsonify({
                "status": "error",
                "message": "Akses ditolak! Hanya admin yang bisa membuat akun baru."
            }), 403

    requested_role = data.get('role', 'user')
    if requested_role not in ('user', 'admin'):
        return jsonify({
            "status": "error",
            "message": "Role harus berupa user atau admin."
        }), 400

    role = 'admin' if is_bootstrap else requested_role
    response_data, status_code = register_user(data, role=role)
    return jsonify(response_data), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "error",
            "message": "Semua kolom (email, password) wajib diisi!"
        }), 400

    response_data, status_code = verify_login(data.get('email'), data.get('password'))
    return jsonify(response_data), status_code

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

    if not data:
        return jsonify({
            "status": "error",
            "message": "Data subscription wajib disertakan!"
        }), 400

    response_data, status_code = subscribe_push(user_id, data)
    return jsonify(response_data), status_code
