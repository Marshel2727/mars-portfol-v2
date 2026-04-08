from flask import Blueprint,request
from app.service.message_service import (
    get_all_messages,
    get_message_by_id,
    create_message,
    delete_message,
    mark_as_read
)
from app.utils.response import error_response, success_response
from flask_jwt_extended import jwt_required,get_jwt

message_bp = Blueprint('message_bp', __name__, url_prefix='/api/messages')

@message_bp.route('/', methods=['GET'])
@jwt_required()
def fetch_all_message():
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    messages = get_all_messages()

    return success_response(data=messages)

@message_bp.route('/<int:id>', methods = ['GET'])
@jwt_required()
def fetch_message_by_id(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    message = get_message_by_id(id)

    if message:
        return success_response(data=message)
    return error_response(message='Message tidak ditemukan')

@message_bp.route('/', methods=['POST'])
def add_message():
    data_msg = request.get_json()

    if not data_msg or not data_msg.get('name') or not data_msg.get('email') or not data_msg.get('content'):
        return error_response(message='Nama, Email, dan pesan wajib diisi.')
    
    new_message = create_message(data_msg)
    return success_response(data=new_message, message='Pesan berhasil dikirim.')

@message_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def read_message(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    updated_message = mark_as_read(id)

    if updated_message:
        return success_response(message='Data berhasil diUpdate.')
    return error_response(message='Message tidak ditemukan.')

@message_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_message(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    message = delete_message(id)

    if message:
        return success_response(message='Message berhasil hapus.')
    return error_response(message='Message tidak ditemukan.')