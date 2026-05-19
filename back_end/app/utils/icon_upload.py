import os
import uuid
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'app/static/uploads/skills'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(image_file):
    if not image_file or image_file.filename == '':
        return None
    
    if allowed_file(image_file.filename):
        filename = secure_filename(image_file.filename)

        # Membuat nama file unik agar tidak bentrok jika ada gambar bernama sama
        unique_filename = f'{uuid.uuid4().hex}_{filename}'

        # Memastikan folder tujuan ada, jika belum maka buat otomatis
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # PERBAIKAN: Menggunakan os.path.join, bukan os.pathsep.join
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        # Menyimpan file fisik ke dalam folder
        image_file.save(file_path)

        # Mengembalikan URL relatif untuk disimpan di database
        return f'/static/uploads/skills/{unique_filename}'
        
    return None

def delete_image(file_url):
    if not file_url:
        return

    relative_path = file_url.lstrip('/')
    
    file_path = os.path.join('app', relative_path)

    if os.path.exists(file_path):
        os.remove(file_path)