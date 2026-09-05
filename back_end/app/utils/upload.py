from app.utils.image_storage import save_validated_image, delete_stored_image

UPLOAD_FOLDER = 'app/static/uploads/projects'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


def save_image(image_file):
    return save_validated_image(image_file, UPLOAD_FOLDER, ALLOWED_EXTENSIONS)


def delete_image(file_url):
    delete_stored_image(file_url, UPLOAD_FOLDER)
