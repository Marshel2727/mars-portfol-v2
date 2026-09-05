import io
import uuid
import warnings
from pathlib import Path

from PIL import Image, UnidentifiedImageError
from werkzeug.exceptions import BadRequest

MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 16_000_000
FORMATS = {'png': 'PNG', 'jpg': 'JPEG', 'jpeg': 'JPEG', 'gif': 'GIF', 'webp': 'WEBP'}


def save_validated_image(upload, folder, extensions):
    if not upload or not upload.filename:
        return None
    extension = upload.filename.rsplit('.', 1)[-1].lower()
    if '.' not in upload.filename or extension not in extensions:
        raise BadRequest('Format gambar tidak didukung.')
    payload = upload.stream.read(MAX_FILE_BYTES + 1)
    if len(payload) > MAX_FILE_BYTES:
        raise BadRequest('Ukuran gambar maksimal 5 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(payload)) as probe:
                if probe.format != FORMATS[extension] or probe.width * probe.height > MAX_PIXELS:
                    raise ValueError('Invalid image format or dimensions')
                probe.verify()
            with Image.open(io.BytesIO(payload)) as decoded:
                # Decode and strip metadata; animated uploads use their first frame.
                decoded.seek(0)
                decoded.load()
                clean = decoded.convert('RGB' if extension in ('jpg', 'jpeg') else 'RGBA')
                output = io.BytesIO()
                clean.save(output, format='JPEG' if extension in ('jpg', 'jpeg') else 'PNG')
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise BadRequest('Gambar rusak, format tidak sesuai, atau resolusi melebihi 16 megapiksel.') from error
    suffix = 'jpg' if extension in ('jpg', 'jpeg') else 'png'
    directory = Path(folder)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f'{uuid.uuid4().hex}.{suffix}'
    (directory / filename).write_bytes(output.getvalue())
    return f'/static/uploads/{directory.name}/{filename}'


def delete_stored_image(file_url, folder):
    if not isinstance(file_url, str):
        return
    directory = Path(folder).resolve()
    prefix = f'/static/uploads/{directory.name}/'
    if not file_url.startswith(prefix):
        return
    filename = file_url[len(prefix):]
    if not filename or '/' in filename or '\\' in filename:
        return
    target = (directory / filename).resolve()
    if target.parent == directory and target.is_file():
        target.unlink()
