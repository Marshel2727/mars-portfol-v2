from app.utils.image_storage import save_validated_image, delete_stored_image

UPLOAD_FOLDER = 'app/static/uploads/skills'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_DIMENSION = 512
WEBP_QUALITY = 85


def save_image(image_file):
    return save_validated_image(
        image_file,
        UPLOAD_FOLDER,
        ALLOWED_EXTENSIONS,
        max_dimension=MAX_DIMENSION,
        quality=WEBP_QUALITY,
    )


def delete_image(file_url):
    delete_stored_image(file_url, UPLOAD_FOLDER)
