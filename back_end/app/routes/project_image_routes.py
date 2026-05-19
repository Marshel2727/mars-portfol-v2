from flask import Blueprint, request
from app.service.project_image_service import add_project_image, delete_project_image
from app.service.project_service import get_project_by_id
from app.utils.response import error_response, success_response
from flask_jwt_extended import get_jwt, jwt_required
from app.utils.upload import save_image, delete_image
from app import db
from app.models.project_image import ProjectImage


project_image_bp = Blueprint('project_image_bp', __name__, url_prefix='/api/project-images')

@project_image_bp.route('/', methods=['POST'])
@jwt_required()
def upload_project_gallery():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    project_id = request.form.get('project_id')
    image_file = request.files.get('image_file')
    caption = request.form.get('caption')

    if not project_id:
        return error_response(message='Project_id wajib ada')
    
    project = get_project_by_id(project_id)

    if not project:
        return error_response(message='Project tidak ditemukan', status_code=404)
    
    if not image_file or image_file.filename == '':
        return error_response(message='Gambar wajib diupload')
    
    image_url = save_image(image_file)

    if not image_url:
        return error_response(message='Format gambar tidak valid! Gunakan png, jpg, jpeg, atau gif')
    
    new_gallery_image = add_project_image(project_id, image_url, caption)
    return success_response(data=new_gallery_image, status_code=201)


@project_image_bp.route('/<int:image_id>', methods=['DELETE'])
@jwt_required()
def remove_project_gallery(image_id):
    claims = get_jwt() 
    if claims.get('role') != 'admin':
        return error_response(message='Akses ditolak! Hanya admin yang boleh mengakses.', status_code=403)
    
    # Cari foto untuk mengambil URL-nya sebelum dihapus dari DB
    image_to_delete = db.session.get(ProjectImage, image_id)
    if not image_to_delete:
        return error_response(message='Gambar galeri tidak ditemukan', status_code=404)
    
    image_url_to_delete = image_to_delete.image_url
    
    # Hapus dari DB
    success = delete_project_image(image_id)

    if success:
        # Hapus file fisiknya
        delete_image(image_url_to_delete)
        return success_response(message='Gambar galeri berhasil dihapus')
        
    return error_response(message='Gagal menghapus gambar galeri')