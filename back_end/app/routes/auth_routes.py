from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.service.auth_service import register_user,verify_login

auth_bp = Blueprint('auth_bp', __name__, url_prefix=('/api/auth'))

@auth_bp.route('/register', methods=['POST'])
#@jwt_required()
def register():
#    claims = get_jwt()
#    if claims.get('role') != 'admin':
#       return jsonify({"status": "error", "message": "Akses ditolak! Hanya admin yang bisa membuat akun baru."}), 403

    data = request.get_json()

    if not data or not data.get('username') or  not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "error", 
            "message": "Semua kolom (username, email, password) wajib diisi!"
        }), 400
    
    response_data, status_code = register_user(data)
    return jsonify(response_data), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "error", 
            "message": "Semua kolom (email, password) wajib diisi!"
        }), 400
    
    response_data, status_code = verify_login(data.get('email'), data.get('password'))
    return jsonify(response_data), status_code