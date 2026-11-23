from app.utils.image_storage import save_validated_image, delete_stored_image


UPLOAD_FOLDER = 'app/static/uploads/about'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_DIMENSION = 800
WEBP_QUALITY = 82


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_profile_image(image_file):
    return save_validated_image(
        image_file,
        UPLOAD_FOLDER,
        ALLOWED_EXTENSIONS,
        max_dimension=MAX_DIMENSION,
        quality=WEBP_QUALITY,
    )


def delete_profile_image(file_url):
    delete_stored_image(file_url, UPLOAD_FOLDER)
