import uuid
from pathlib import Path

from werkzeug.exceptions import BadRequest

from app.utils.image_storage import delete_stored_image

UPLOAD_FOLDER = 'app/static/uploads/cv'
MAX_CV_BYTES = 10 * 1024 * 1024


def save_cv(upload):
    if not upload or not upload.filename:
        return None
    if not upload.filename.lower().endswith('.pdf'):
        raise BadRequest('CV harus berupa file PDF.')
    payload = upload.stream.read(MAX_CV_BYTES + 1)
    if len(payload) > MAX_CV_BYTES:
        raise BadRequest('Ukuran CV maksimal 10 MB.')
    if not payload.startswith(b'%PDF-') or b'%%EOF' not in payload[-1024:]:
        raise BadRequest('File CV tidak memiliki format PDF yang valid.')
    directory = Path(UPLOAD_FOLDER)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid.uuid4().hex}.pdf'
    (directory / filename).write_bytes(payload)
    return f'/static/uploads/cv/{filename}'


def delete_cv(url):
    delete_stored_image(url, UPLOAD_FOLDER)
