import os
import uuid
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'app/static/uploads/projects'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(image_file):
    if not image_file or  image_file.filename == '':
        return None
    
    if allowed_file(image_file.filename):
        filename = secure_filename(image_file.filename)

        unique_filename = f'{uuid.uuid4().hex}_{filename}'

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        image_file.save(file_path)

        return f"/static/uploads/projects/{unique_filename}"
    return None

def delete_image(file_url):
    """Fungsi untuk menghapus file gambar fisik proyek dari hard drive"""
    if not file_url:
        return

    # Menghapus tanda '/' di depan agar path tidak error
    relative_path = file_url.lstrip('/')
    
    # Menggabungkan dengan folder 'app'
    file_path = os.path.join('app', relative_path)

    # Mengecek dan menghapus file jika ada
    if os.path.exists(file_path):
        os.remove(file_path)