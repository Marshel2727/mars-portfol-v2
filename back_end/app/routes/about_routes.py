from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.service.about_service import get_about_profile, update_about_profile
from app.utils.about_upload import delete_profile_image, save_profile_image
from app.utils.response import error_response, success_response
from app.utils.cache import public_cache


about_bp = Blueprint('about_bp', __name__, url_prefix='/api/about')


@about_bp.route('/', methods=['GET'])
@public_cache(seconds=60)
def fetch_about_profile():
    return success_response(data=get_about_profile())


@about_bp.route('/', methods=['PUT'])
@jwt_required()
def edit_about_profile():
    if get_jwt().get('role') != 'admin':
        return error_response(
            message='Akses ditolak! Hanya admin yang boleh mengakses.',
            status_code=403,
        )

    current_profile = get_about_profile()
    allowed_fields = [
        'full_name',
        'headline',
        'bio',
        'education',
        'location',
        'current_focus',
        'cv_url',
    ]
    data = {field: request.form.get(field, '').strip() for field in allowed_fields if field in request.form}

    if not data.get('full_name') or not data.get('headline') or not data.get('bio'):
        return error_response(message='Nama, headline, dan narasi wajib diisi.', status_code=400)

    image_file = request.files.get('profile_image')
    if image_file and image_file.filename:
        image_url = save_profile_image(image_file)
        if not image_url:
            return error_response(message='Gunakan foto berformat png, jpg, jpeg, atau webp.', status_code=400)
        data['profile_image_url'] = image_url

    updated_profile = update_about_profile(data)

    old_image_url = current_profile.get('profile_image_url')
    if data.get('profile_image_url') and old_image_url:
        delete_profile_image(old_image_url)

    return success_response(data=updated_profile, message='Profil About berhasil diperbarui.')
