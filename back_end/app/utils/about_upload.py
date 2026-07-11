import os
import uuid

from werkzeug.utils import secure_filename


UPLOAD_FOLDER = 'app/static/uploads/about'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_profile_image(image_file):
    if not image_file or image_file.filename == '' or not _allowed_file(image_file.filename):
        return None

    filename = secure_filename(image_file.filename)
    unique_filename = f'{uuid.uuid4().hex}_{filename}'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    image_file.save(os.path.join(UPLOAD_FOLDER, unique_filename))
    return f'/static/uploads/about/{unique_filename}'


def delete_profile_image(file_url):
    if not file_url or not file_url.startswith('/static/uploads/about/'):
        return

    file_path = os.path.join('app', file_url.lstrip('/'))
    if os.path.exists(file_path):
        os.remove(file_path)
