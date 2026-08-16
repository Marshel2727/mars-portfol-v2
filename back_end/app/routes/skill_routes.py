import json

from flask import Blueprint, request
from app.service.skill_service import get_all_skill,get_skill_by_id,create_skill,update_skill,delete_skill
from app.utils.response import error_response, success_response
from app.utils.icon_upload import save_image, delete_image
from app.utils.cache import public_cache
from flask_jwt_extended import jwt_required,get_jwt


skill_bp = Blueprint('skill_bp', __name__, url_prefix='/api/skills')
ALLOWED_LEVELS = {'beginner', 'intermediate', 'advanced', 'expert'}


def _parse_project_ids(raw_value):
    try:
        value = json.loads(raw_value or '[]')
    except json.JSONDecodeError as exc:
        raise ValueError('project_ids harus berupa daftar JSON yang valid') from exc

    if not isinstance(value, list):
        raise ValueError('project_ids harus berupa daftar')
    return value


def _parse_skill_presentation_fields(form, partial=False):
    result = {}
    detail = (form.get('detail') or '').strip() or None
    years_experience = (form.get('years_experience') or '').strip() or None
    try:
        proficiency = int(form.get('proficiency') or 0)
        display_order = int(form.get('display_order') or 0)
    except ValueError as exc:
        raise ValueError('Proficiency dan urutan tampil harus berupa angka.') from exc

    if detail and len(detail) > 180:
        raise ValueError('Detail skill maksimal 180 karakter.')
    if years_experience and len(years_experience) > 50:
        raise ValueError('Lama pengalaman maksimal 50 karakter.')
    if not 0 <= proficiency <= 100:
        raise ValueError('Proficiency harus berada di antara 0 dan 100.')
    if not 0 <= display_order <= 9999:
        raise ValueError('Urutan tampil harus berada di antara 0 dan 9999.')

    if not partial or 'detail' in form:
        result['detail'] = detail
    if not partial or 'proficiency' in form:
        result['proficiency'] = proficiency or None
    if not partial or 'years_experience' in form:
        result['years_experience'] = years_experience
    if not partial or 'display_order' in form:
        result['display_order'] = display_order
    return result

@skill_bp.route('/', methods=['GET'])
@public_cache(seconds=60)
def fetch_all_skills():
    skills = get_all_skill()

    return success_response(data=skills)

@skill_bp.route('/<int:id>', methods=['GET'])
@public_cache(seconds=60)
def fetch_skill_by_id(id):
    
    skill = get_skill_by_id(id)

    if skill:
        return success_response(data=skill)
    return error_response(message='Skill tidak ditemukan!', status_code=404)

@skill_bp.route('/', methods=['POST'])
@jwt_required()
def add_skill():
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    name = (request.form.get('name') or '').strip()
    level = (request.form.get('level') or '').strip().lower()
    category = request.form.get('category', '').strip() or 'Lainnya'

    if not name:
        return error_response(message="Nama wajib diisi.")
    if level not in ALLOWED_LEVELS:
        return error_response(message="Level harus beginner, intermediate, advanced, atau expert.")
    if len(name) > 200:
        return error_response(message="Nama skill maksimal 200 karakter.")

    try:
        project_ids = _parse_project_ids(request.form.get('project_ids'))
        presentation_fields = _parse_skill_presentation_fields(request.form)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    
    image_file = request.files.get('icon_url')
    
    if not image_file or image_file.filename == '':
        return error_response(message='Icon wajib diupload.')
    
    icon_url = save_image(image_file)

    if not icon_url:
        return error_response(message='Format gambar tidak valid')
    
    data = {
        'name': name,
        'level': level,
        'icon_url': icon_url,
        'category': category,
        'project_ids': project_ids,
        **presentation_fields,
    }

    new_skill = create_skill(data)
    return success_response(data=new_skill, status_code=201)

@skill_bp.route('/<int:id>', methods = ['PUT'])
@jwt_required()
def edit_skill(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    old_skill = get_skill_by_id(id)
    if not old_skill:
        return error_response(message='Skill tidak ditemukan.', status_code=404)
    
    name = (request.form.get('name') or '').strip()
    level = (request.form.get('level') or '').strip().lower()
    category = request.form.get('category')

    data = {}
    if 'name' in request.form:
        if not name or len(name) > 200:
            return error_response(message='Nama skill wajib diisi dan maksimal 200 karakter.', status_code=400)
        data['name'] = name
    if 'level' in request.form:
        if level not in ALLOWED_LEVELS:
            return error_response(message='Level skill tidak valid.', status_code=400)
        data['level'] = level
    if 'category' in request.form:
        data['category'] = category.strip() or 'Lainnya'
    if 'project_ids' in request.form:
        try:
            data['project_ids'] = _parse_project_ids(request.form.get('project_ids'))
        except ValueError as exc:
            return error_response(message=str(exc), status_code=400)
    if any(field in request.form for field in ('detail', 'proficiency', 'years_experience', 'display_order')):
        try:
            data.update(_parse_skill_presentation_fields(request.form, partial=True))
        except ValueError as exc:
            return error_response(message=str(exc), status_code=400)
    
    old_icon_to_delete = None
    new_icon_to_cleanup = None
    if 'icon_url' in request.files:
        file = request.files.get('icon_url')
        new_icon = save_image(file)
        if not new_icon:
            return error_response(message='Format gambar tidak valid! Gunakan png, jpg, jpeg, atau gif.', status_code=400)
        old_icon_to_delete = old_skill.get('icon_url')
        new_icon_to_cleanup = new_icon
        data['icon_url'] = new_icon
    
    updated_skill = update_skill(id, data)

    if updated_skill:
        if old_icon_to_delete:
            delete_image(old_icon_to_delete)
        return success_response(data=updated_skill, status_code=200)

    if new_icon_to_cleanup:
        delete_image(new_icon_to_cleanup)
    return error_response(message='Skil tidak ditemukan.', status_code=404)

@skill_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_skill(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    skill_to_delete = get_skill_by_id(id)
    if not skill_to_delete:
        return error_response(message='Skill tidak ditemukan.', status_code=404)
    old_icon_url = skill_to_delete.get('icon_url')
    
    success = delete_skill(id)

    if success:
        if old_icon_url:
            delete_image(old_icon_url)
        return success_response(message='Skill berhasil dihapus.')
    return error_response(message='Skill tidak ditemukan.')
