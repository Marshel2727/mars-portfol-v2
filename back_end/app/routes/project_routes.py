import json
from urllib.parse import urlparse

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
from flask_jwt_extended import jwt_required, get_jwt


project_bp = Blueprint('project_bp', __name__, url_prefix='/api/projects')


def _parse_json_list(raw_value, field_name):
    try:
        value = json.loads(raw_value or '[]')
    except json.JSONDecodeError as exc:
        raise ValueError(f'{field_name} harus berupa daftar JSON yang valid') from exc

    if not isinstance(value, list):
        raise ValueError(f'{field_name} harus berupa daftar')
    return value


def _optional_text(value):
    normalized = (value or '').strip()
    return normalized or None


def _is_valid_http_url(value):
    if not value:
        return True
    parsed = urlparse(value)
    return parsed.scheme in ('http', 'https') and bool(parsed.netloc)


def _validate_architecture_steps(steps):
    if len(steps) > 12:
        raise ValueError('Maksimal 12 langkah arsitektur per project.')
    for step in steps:
        if not isinstance(step, dict):
            raise ValueError('Setiap langkah arsitektur harus berupa objek.')
        title = str(step.get('title') or '').strip()
        description = str(step.get('description') or '').strip()
        label = str(step.get('label') or '').strip()
        if not title or not description:
            raise ValueError('Judul dan deskripsi langkah arsitektur wajib diisi.')
        if len(title) > 100 or len(description) > 500 or len(label) > 30:
            raise ValueError('Isi langkah arsitektur terlalu panjang.')
    return steps

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
    
    title = (request.form.get('title') or '').strip()
    sub_title = _optional_text(request.form.get('sub_title'))
    description = (request.form.get('description') or '').strip()
    demo_url = _optional_text(request.form.get('demo_url'))
    github_url = _optional_text(request.form.get('github_url'))
    category = request.form.get('category', '').strip() or 'Lainnya'

    if not title or not description:
        return error_response(message='title dan description wajib di isi')
    if len(title) > 100 or (sub_title and len(sub_title) > 150):
        return error_response(message='Judul maksimal 100 karakter dan subjudul maksimal 150 karakter.')
    if not _is_valid_http_url(demo_url) or not _is_valid_http_url(github_url):
        return error_response(message='URL demo dan GitHub harus menggunakan http atau https.')

    try:
        tech_tags = _parse_json_list(request.form.get('tech_tags'), 'tech_tags')
        skill_ids = _parse_json_list(request.form.get('skill_ids'), 'skill_ids')
        architecture_steps = _validate_architecture_steps(
            _parse_json_list(request.form.get('architecture_steps'), 'architecture_steps')
        )
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
        'skill_ids': skill_ids,
        'architecture_steps': architecture_steps,
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

    data = {}
    if 'title' in request.form:
        title = (request.form.get('title') or '').strip()
        if not title:
            return error_response(message='Title wajib diisi.', status_code=400)
        if len(title) > 100:
            return error_response(message='Judul maksimal 100 karakter.', status_code=400)
        data['title'] = title
    if 'description' in request.form:
        description = (request.form.get('description') or '').strip()
        if not description:
            return error_response(message='Description wajib diisi.', status_code=400)
        data['description'] = description
    if 'sub_title' in request.form:
        sub_title = _optional_text(request.form.get('sub_title'))
        if sub_title and len(sub_title) > 150:
            return error_response(message='Subjudul maksimal 150 karakter.', status_code=400)
        data['sub_title'] = sub_title
    for url_field in ('demo_url', 'github_url'):
        if url_field in request.form:
            url_value = _optional_text(request.form.get(url_field))
            if not _is_valid_http_url(url_value):
                return error_response(message=f'{url_field} harus menggunakan http atau https.', status_code=400)
            data[url_field] = url_value
    if 'category' in request.form:
        data['category'] = (request.form.get('category') or '').strip() or 'Lainnya'

    try:
        if 'tech_tags' in request.form:
            data['tech_tags'] = _parse_json_list(request.form.get('tech_tags'), 'tech_tags')
        if 'skill_ids' in request.form:
            data['skill_ids'] = _parse_json_list(request.form.get('skill_ids'), 'skill_ids')
        if 'architecture_steps' in request.form:
            data['architecture_steps'] = _validate_architecture_steps(
                _parse_json_list(request.form.get('architecture_steps'), 'architecture_steps')
            )
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400)

    old_image_to_delete = None
    new_image_to_cleanup = None
    if 'image' in request.files:
        file = request.files['image']
        new_image_url = save_image(file)
        if not new_image_url:
            return error_response(message='Format gambar tidak valid! Gunakan png, jpg, jpeg, atau gif', status_code=400)
        old_image_to_delete = old_project.get('image_url')
        new_image_to_cleanup = new_image_url
        data['image_url'] = new_image_url

    updated_project = update_project(id, data)

    if updated_project:
        if old_image_to_delete:
            delete_image(old_image_to_delete)
        return success_response(data=updated_project)

    if new_image_to_cleanup:
        delete_image(new_image_to_cleanup)
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
    gallery_urls = [image.get('image_url') for image in project_to_delete.get('gallery', [])]
    
    success = delete_project(id)

    if success:
        if old_project:
            delete_image(old_project)
        for gallery_url in gallery_urls:
            if gallery_url:
                delete_image(gallery_url)
        return success_response(message='Project berhasil dihapus')
    return error_response(message='Project tidak ditemukan')
