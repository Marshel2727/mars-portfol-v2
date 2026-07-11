import json

from flask import Blueprint, request
from app.service.skill_service import get_all_skill,get_skill_by_id,create_skill,update_skill,delete_skill
from app.utils.response import error_response, success_response
from app.utils.icon_upload import save_image, delete_image
from app.utils.cache import public_cache
from flask_jwt_extended import jwt_required,get_jwt


skill_bp = Blueprint('skill_bp', __name__, url_prefix='/api/skills')


def _parse_project_ids(raw_value):
    try:
        value = json.loads(raw_value or '[]')
    except json.JSONDecodeError as exc:
        raise ValueError('project_ids harus berupa daftar JSON yang valid') from exc

    if not isinstance(value, list):
        raise ValueError('project_ids harus berupa daftar')
    return value

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
    
    name = request.form.get('name')
    level = request.form.get('level')
    category = request.form.get('category', '').strip() or 'Lainnya'

    if not name:
        return error_response(message="Nama wajib diisi.")

    try:
        project_ids = _parse_project_ids(request.form.get('project_ids'))
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
        'project_ids': project_ids
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
        return error_response(message='Skill tidak ditemukan.', status_code=400)
    
    name = request.form.get('name')
    level = request.form.get('level')
    category = request.form.get('category')

    data = {}
    if name:
        data['name'] = name
    if level:
        data['level'] = level
    if category:
        data['category'] = category.strip() or 'Lainnya'
    if 'project_ids' in request.form:
        try:
            data['project_ids'] = _parse_project_ids(request.form.get('project_ids'))
        except ValueError as exc:
            return error_response(message=str(exc), status_code=400)
    
    if 'icon_url' in request.files:
        file = request.files.get('icon_url')
        new_icon = save_image(file)
        if new_icon:
            if old_skill.get('icon_url'):
                delete_image(old_skill['icon_url'])
            data['icon_url'] = new_icon
    
    updated_skill = update_skill(id, data)

    if updated_skill:
        return success_response(data=updated_skill, status_code=200)
    
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
