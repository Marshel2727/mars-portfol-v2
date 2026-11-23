import uuid
from pathlib import Path

from werkzeug.exceptions import BadRequest

from app.utils.image_storage import delete_stored_image, save_validated_image

UPLOAD_FOLDER = 'app/static/uploads/certificates'
MAX_PDF_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def save_certificate_file(upload):
    """Validate and store a certificate image or PDF file, returning (url, file_type)."""
    if not upload or not upload.filename:
        raise BadRequest('File sertifikat wajib diupload.')

    filename_lower = upload.filename.lower()
    if filename_lower.endswith('.pdf'):
        payload = upload.stream.read(MAX_PDF_BYTES + 1)
        if len(payload) > MAX_PDF_BYTES:
            raise BadRequest('Ukuran file PDF sertifikat maksimal 10 MB.')
        if not payload.startswith(b'%PDF-') or b'%%EOF' not in payload[-1024:]:
            raise BadRequest('File sertifikat tidak memiliki format PDF yang valid.')
        directory = Path(UPLOAD_FOLDER)
        directory.mkdir(parents=True, exist_ok=True)
        filename = f'{uuid.uuid4().hex}.pdf'
        (directory / filename).write_bytes(payload)
        return f'/static/uploads/{directory.name}/{filename}', 'pdf'

    if '.' in filename_lower:
        extension = filename_lower.rsplit('.', 1)[-1]
        if extension in ALLOWED_IMAGE_EXTENSIONS:
            url = save_validated_image(
                upload,
                UPLOAD_FOLDER,
                ALLOWED_IMAGE_EXTENSIONS,
                max_dimension=1920,
                quality=85,
            )
            return url, 'image'

    raise BadRequest('Format file sertifikat tidak didukung. Gunakan PNG, JPG, WebP, atau PDF.')


def delete_certificate_file(file_url):
    """Remove a stored certificate file from UPLOAD_FOLDER safely."""
    delete_stored_image(file_url, UPLOAD_FOLDER)
