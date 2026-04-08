from flask import Blueprint,request
from app.service.project_service import (
    get_all_projects,
    get_project_by_id,
    create_project,
    update_project,
    delete_project
    )
from app.utils.upload import save_image
from app.utils.response import success_response, error_response
from flask_jwt_extended import jwt_required, get_jwt_identity,get_jwt


project_bp = Blueprint('project_bp', __name__, url_prefix='/api/projects')

@project_bp.route('/', methods=['GET'])
def fetch_all_projects():
    
    projects = get_all_projects()

    return success_response(data=projects)

@project_bp.route('/<int:id>', methods=['GET'])
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
    description = request.form.get('description')
    demo_url = request.form.get('demo_url')
    github_url = request.form.get('github_url')

    if not title or not description:
        return error_response(message='title dan description wajib di isi')
    
    image_file = request.files.get('image')

    if not image_file or image_file.filename =='':
        return error_response(message='gambar wajib diupload')
    
    image_url = save_image(image_file)

    if not image_url:
        return error_response(message='Format gambar tidak valid! Gunakan png, jpg, jpeg, atau gif')

    data = {
        'title':title,
        'description': description,
        'demo_url': demo_url,
        'github_url': github_url,
        'image_url': image_url
    }
    
    new_project = create_project(data)
    return success_response(data=new_project, status_code=201)

@project_bp.route('/<int:id>', methods = ['PUT'])
@jwt_required()
def edit_project(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)

    allowed_keys = ['title', 'description', 'demo_url', 'github_url']

    data = {key: value for key, value in request.form.items() if key in allowed_keys and value}

    if 'image' in request.files:
        file = request.files['image']
        new_image_url = save_image(file)
        if new_image_url:
            data['image_url'] = new_image_url

    apdated_project = update_project(id, data)

    if apdated_project:
        return success_response(data=update_project)
    
    return error_response(message='project tidak ditemukan', status_code=404)

@project_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def remove_project(id):
    claims = get_jwt() # Mengambil seluruh isi token, termasuk klaim tambahan
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    success = delete_project(id)

    if success:
        return success_response(message='Project berhasil dihapus')
    return error_response(message='Project tidak ditemukan')