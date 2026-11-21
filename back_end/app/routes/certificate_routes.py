from urllib.parse import urlparse

from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.service.certificate_service import (
    create_certificate,
    delete_certificate,
    get_all_certificates,
    get_certificate_by_id,
    update_certificate,
)
from app.utils.cache import public_cache
from app.utils.certificate_upload import delete_certificate_file, save_certificate_file
from app.utils.response import error_response, success_response


certificate_bp = Blueprint('certificate_bp', __name__, url_prefix='/api/certificates')

_REQUIRED_TEXT_FIELDS = (
    ('title', 200, 'Judul sertifikat'),
    ('issuer', 150, 'Penerbit sertifikat'),
)
_OPTIONAL_TEXT_FIELDS = (
    ('issue_date', 50, 'Tanggal terbit'),
    ('credential_id', 120, 'ID kredensial'),
    ('description', 500, 'Deskripsi sertifikat'),
)


def _require_admin():
    if get_jwt().get('role') != 'admin':
        return error_response(
            message='Akses ditolak! Hanya admin yang boleh mengakses.',
            status_code=403,
        )
    return None


def _parse_certificate_form(form, partial=False):
    data = {}

    for field, max_len, label in _REQUIRED_TEXT_FIELDS:
        if not partial or field in form:
            value = (form.get(field) or '').strip()
            if not value:
                raise ValueError(f'{label} wajib diisi.')
            if len(value) > max_len:
                raise ValueError(f'{label} maksimal {max_len} karakter.')
            data[field] = value

    if not partial or 'category' in form:
        category = (form.get('category') or '').strip() or 'Lainnya'
        if len(category) > 100:
            raise ValueError('Kategori sertifikat maksimal 100 karakter.')
        data['category'] = category

    for field, max_len, label in _OPTIONAL_TEXT_FIELDS:
        if not partial or field in form:
            value = (form.get(field) or '').strip() or None
            if value and len(value) > max_len:
                raise ValueError(f'{label} maksimal {max_len} karakter.')
            data[field] = value

    if not partial or 'credential_url' in form:
        credential_url = (form.get('credential_url') or '').strip() or None
        if credential_url:
            if len(credential_url) > 500:
                raise ValueError('URL kredensial maksimal 500 karakter.')
            parsed = urlparse(credential_url)
            if parsed.scheme not in ('http', 'https') or not parsed.netloc:
                raise ValueError('URL kredensial harus menggunakan http atau https.')
        data['credential_url'] = credential_url

    if not partial or 'is_featured' in form:
        raw_featured = (form.get('is_featured') or '').strip().lower()
        if raw_featured in ('true', '1'):
            data['is_featured'] = True
        elif raw_featured in ('false', '0', ''):
            data['is_featured'] = False
        else:
            raise ValueError('Pilihan sertifikat unggulan tidak valid.')

    if not partial or 'display_order' in form:
        raw_order = (form.get('display_order') or '').strip()
        if raw_order == '':
            display_order = 0
        else:
            try:
                display_order = int(raw_order)
            except ValueError as exc:
                raise ValueError('Urutan tampil harus berupa bilangan bulat.') from exc
        if not 0 <= display_order <= 9999:
            raise ValueError('Urutan tampil harus berada di antara 0 dan 9999.')
        data['display_order'] = display_order

    return data


@certificate_bp.route('/', methods=['GET'])
@public_cache(seconds=60)
def fetch_all_certificates():
    certificates = get_all_certificates()
    return success_response(data=certificates)


@certificate_bp.route('/<int:id>', methods=['GET'])
@public_cache(seconds=60)
def fetch_certificate_by_id(id):
    certificate = get_certificate_by_id(id)
    if certificate:
        return success_response(data=certificate)
    return error_response(message='Sertifikat tidak ditemukan.', status_code=404)


@certificate_bp.route('/', methods=['POST'])
@jwt_required()
def add_certificate():
    denied = _require_admin()
    if denied:
        return denied

    try:
        data = _parse_certificate_form(request.form, partial=False)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)

    file_upload = request.files.get('file')
    if not file_upload or not file_upload.filename:
        return error_response(message='File sertifikat wajib diupload.', status_code=400)

    file_url, file_type = save_certificate_file(file_upload)
    data['file_url'] = file_url
    data['file_type'] = file_type

    try:
        new_certificate = create_certificate(data)
    except Exception:
        delete_certificate_file(file_url)
        raise

    return success_response(data=new_certificate, status_code=201)


@certificate_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def edit_certificate(id):
    denied = _require_admin()
    if denied:
        return denied

    old_certificate = get_certificate_by_id(id)
    if not old_certificate:
        return error_response(message='Sertifikat tidak ditemukan.', status_code=404)

    try:
        data = _parse_certificate_form(request.form, partial=True)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)

    old_file_to_delete = None
    new_file_to_cleanup = None
    file_upload = request.files.get('file')
    if file_upload and file_upload.filename:
        new_file_url, new_file_type = save_certificate_file(file_upload)
        old_file_to_delete = old_certificate.get('file_url')
        new_file_to_cleanup = new_file_url
        data['file_url'] = new_file_url
        data['file_type'] = new_file_type

    try:
        updated_certificate = update_certificate(id, data)
    except Exception:
        if new_file_to_cleanup:
            delete_certificate_file(new_file_to_cleanup)
        raise

    if updated_certificate:
        if old_file_to_delete and old_file_to_delete != new_file_to_cleanup:
            delete_certificate_file(old_file_to_delete)
        return success_response(data=updated_certificate, status_code=200)

    if new_file_to_cleanup:
        delete_certificate_file(new_file_to_cleanup)
    return error_response(message='Sertifikat tidak ditemukan.', status_code=404)


@certificate_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_certificate(id):
    denied = _require_admin()
    if denied:
        return denied

    cert_to_delete = get_certificate_by_id(id)
    if not cert_to_delete:
        return error_response(message='Sertifikat tidak ditemukan.', status_code=404)

    old_file_url = cert_to_delete.get('file_url')
    if delete_certificate(id):
        if old_file_url:
            delete_certificate_file(old_file_url)
        return success_response(message='Sertifikat berhasil dihapus.')

    return error_response(message='Sertifikat tidak ditemukan.', status_code=404)
