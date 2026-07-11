import json

from flask import Blueprint, request
from app.service.project_service import (
    get_all_projects,
    get_project_by_id,
    create_project,
    update_project,
    delete_project
    )
from app.utils.upload import save_image, delete_image
from app.utils.response import success_response, error_response
from app.utils.cache import public_cache
from flask_jwt_extended import jwt_required, get_jwt_identity,get_jwt


project_bp = Blueprint('project_bp', __name__, url_prefix='/api/projects')


def _parse_json_list(raw_value, field_name):
    try:
        value = json.loads(raw_value or '[]')
    except json.JSONDecodeError as exc:
        raise ValueError(f'{field_name} harus berupa daftar JSON yang valid') from exc

    if not isinstance(value, list):
        raise ValueError(f'{field_name} harus berupa daftar')
    return value

@project_bp.route('/', methods=['GET'])
@public_cache(seconds=60)
def fetch_all_projects():
    
    projects = get_all_projects()

    return success_response(data=projects)

@project_bp.route('/<int:id>', methods=['GET'])
@public_cache(seconds=60)
def fetch_project_by_id(id):
    project = get_project_by_id(id)

    if project:
        return success_response(data=project)
    return error_response(message='data tidak ditemukan', status_code=404)

@project_bp.route('/', methods=['POST'])
@jwt_required()
def add_project():
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    title = request.form.get('title')
    sub_title = request.form.get('sub_title')
    description = request.form.get('description')
    demo_url = request.form.get('demo_url')
    github_url = request.form.get('github_url')
    category = request.form.get('category', '').strip() or 'Lainnya'

    if not title or not description:
        return error_response(message='title dan description wajib di isi')

    try:
        tech_tags = _parse_json_list(request.form.get('tech_tags'), 'tech_tags')
        skill_ids = _parse_json_list(request.form.get('skill_ids'), 'skill_ids')
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)
    
    image_file = request.files.get('image')

    if not image_file or image_file.filename =='':
        return error_response(message='gambar wajib diupload')
    
    image_url = save_image(image_file)

    if not image_url:
        return error_response(message='Format gambar tidak valid! Gunakan png, jpg, jpeg, atau gif')

    data = {
        'title':title,
        'sub_title': sub_title,
        'description': description,
        'demo_url': demo_url,
        'github_url': github_url,
        'image_url': image_url,
        'category': category,
        'tech_tags': tech_tags,
        'skill_ids': skill_ids
    }
    
    new_project = create_project(data)
    return success_response(data=new_project, status_code=201)

@project_bp.route('/<int:id>', methods = ['PUT'])
@jwt_required()
def edit_project(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    old_project = get_project_by_id(id)
    if not old_project:
        return error_response(message='Project tidak ditemukan', status_code=404)

    allowed_keys = ['title', 'sub_title', 'description', 'demo_url', 'github_url', 'category']

    data = {key: value for key, value in request.form.items() if key in allowed_keys and value}

    try:
        if 'tech_tags' in request.form:
            data['tech_tags'] = _parse_json_list(request.form.get('tech_tags'), 'tech_tags')
        if 'skill_ids' in request.form:
            data['skill_ids'] = _parse_json_list(request.form.get('skill_ids'), 'skill_ids')
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)

    if 'image' in request.files:
        file = request.files['image']
        new_image_url = save_image(file)
        if new_image_url:
            if old_project.get('image_url'):
                delete_image(old_project['image_url'])
            data['image_url'] = new_image_url

    updated_project = update_project(id, data)

    if updated_project:
        return success_response(data=updated_project)
    
    return error_response(message='project tidak ditemukan', status_code=404)

@project_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_project(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    project_to_delete = get_project_by_id(id)
    if not project_to_delete:
        return error_response(message='Project tidak ditemukan', status_code=404)
    old_project = project_to_delete.get('image_url')
    
    success = delete_project(id)

    if success:
        if old_project:
            delete_image(old_project)
        return success_response(message='Project berhasil dihapus')
    return error_response(message='Project tidak ditemukan')
