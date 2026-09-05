from app.utils.image_storage import save_validated_image, delete_stored_image


UPLOAD_FOLDER = 'app/static/uploads/about'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_profile_image(image_file):
    return save_validated_image(image_file, UPLOAD_FOLDER, ALLOWED_EXTENSIONS)


def delete_profile_image(file_url):
    delete_stored_image(file_url, UPLOAD_FOLDER)
