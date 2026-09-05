import re

from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.service.message_service import (
    create_message,
    delete_message,
    get_all_messages,
    get_message_by_id,
    mark_as_read,
)
from app.utils.response import error_response, success_response
from app.utils.security import rate_limit


message_bp = Blueprint('message_bp', __name__, url_prefix='/api/messages')
EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def _admin_only():
    return get_jwt().get('role') == 'admin'


@message_bp.route('/', methods=['GET'])
@jwt_required()
def fetch_all_message():
    if not _admin_only():
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)

    return success_response(data=get_all_messages())


@message_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def fetch_message_by_id(id):
    if not _admin_only():
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)

    message = get_message_by_id(id)
    if message:
        return success_response(data=message)
    return error_response(message='Message tidak ditemukan.', status_code=404)


@message_bp.route('/', methods=['POST'])
@rate_limit('contact')
def add_message():
    data_msg = request.get_json(silent=True)
    if not isinstance(data_msg, dict) or not all(isinstance(data_msg.get(key), str) and data_msg[key] for key in ('name', 'email', 'content')):
        return error_response(message='Nama, email, dan pesan wajib diisi.')

    normalized_message = {
        'name': str(data_msg['name']).strip(),
        'email': str(data_msg['email']).strip().lower(),
        'content': str(data_msg['content']).strip(),
    }
    if not all(normalized_message.values()):
        return error_response(message='Nama, email, dan pesan wajib diisi.')
    if len(normalized_message['name']) > 150 or len(normalized_message['email']) > 225:
        return error_response(message='Nama atau email terlalu panjang.')
    if len(normalized_message['content']) > 10000:
        return error_response(message='Pesan maksimal 10.000 karakter.')
    if not EMAIL_PATTERN.fullmatch(normalized_message['email']):
        return error_response(message='Format email tidak valid.')

    new_message = create_message(normalized_message)
    return success_response(data=new_message, message='Pesan berhasil dikirim.', status_code=201)


@message_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def read_message(id):
    if not _admin_only():
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)

    updated_message = mark_as_read(id)
    if updated_message:
        return success_response(data=updated_message, message='Pesan ditandai sudah dibaca.')
    return error_response(message='Message tidak ditemukan.', status_code=404)


@message_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_message(id):
    if not _admin_only():
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)

    message = delete_message(id)
    if message:
        return success_response(message='Message berhasil dihapus.')
    return error_response(message='Message tidak ditemukan.', status_code=404)
