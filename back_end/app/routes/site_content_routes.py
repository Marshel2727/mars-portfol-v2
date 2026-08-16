from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.service.site_content_service import get_site_content, update_site_content
from app.utils.cache import public_cache
from app.utils.response import error_response, success_response


site_content_bp = Blueprint('site_content_bp', __name__, url_prefix='/api/site-content')


@site_content_bp.route('/', methods=['GET'])
@public_cache(seconds=60)
def fetch_site_content():
    return success_response(data=get_site_content())


@site_content_bp.route('/', methods=['PUT'])
@jwt_required()
def edit_site_content():
    if get_jwt().get('role') != 'admin':
        return error_response(
            message='Akses ditolak! Hanya admin yang boleh mengakses.',
            status_code=403,
        )

    payload = request.get_json(silent=True) or {}
    content = payload.get('content')
    if not isinstance(content, dict):
        return error_response(message='Konten website harus berupa objek JSON.', status_code=400)

    if len(request.get_data(cache=True)) > 250_000:
        return error_response(message='Konten website terlalu besar.', status_code=413)

    updated = update_site_content(content)
    return success_response(data=updated, message='Konten website berhasil diperbarui.')
