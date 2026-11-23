"""One-time migration script to convert existing uploaded raster images to WebP
and update their references in the database.

Usage (from back_end/ or inside the backend container at /app):
    python scripts/migrate_uploads_to_webp.py --dry-run
    python scripts/migrate_uploads_to_webp.py --delete-originals
"""

import argparse
import io
import sys
import uuid
import warnings
from pathlib import Path

from PIL import Image, UnidentifiedImageError

_SCRIPT_BASE = Path(__file__).resolve().parent.parent
BASE_DIR = _SCRIPT_BASE if (_SCRIPT_BASE / 'app').is_dir() else Path.cwd()
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app import create_app, db
from app.models.about_profile import AboutProfile
from app.models.certificate import Certificate
from app.models.project import Project
from app.models.project_image import ProjectImage
from app.models.skill import Skill
from app.utils.image_storage import MAX_PIXELS, _prepare_clean_image

RASTER_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif'}

FOLDER_CONFIG = {
    'about': {'max_dimension': 800, 'quality': 82},
    'projects': {'max_dimension': 1920, 'quality': 82},
    'certificates': {'max_dimension': 1920, 'quality': 85},
    'skills': {'max_dimension': 512, 'quality': 85},
}


def convert_file_to_webp_bytes(source_path: Path, max_dimension: int, quality: int) -> bytes:
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(source_path) as probe:
            if probe.width * probe.height > MAX_PIXELS:
                raise ValueError(f'Image exceeds {MAX_PIXELS} pixels: {source_path}')
            probe.verify()
        with Image.open(source_path) as decoded:
            clean = _prepare_clean_image(decoded, max_dimension)
            output = io.BytesIO()
            clean.save(output, format='WEBP', quality=quality, method=6)
            return output.getvalue()


def _choose_target_filename(directory: Path, source_path: Path, max_url_len: int) -> str:
    candidate = f'{source_path.stem}.webp'
    prefix = f'/static/uploads/{directory.name}/'
    if len(prefix) + len(candidate) <= max_url_len and not (directory / candidate).exists():
        return candidate
    return f'{uuid.uuid4().hex}.webp'


def _collect_targets():
    targets = []
    for row in AboutProfile.query.all():
        targets.append(('about_profiles', row, 'profile_image_url', 'about', 255))
    for row in Project.query.all():
        targets.append(('projects', row, 'image_url', 'projects', 150))
    for row in ProjectImage.query.all():
        targets.append(('project_images', row, 'image_url', 'projects', 255))
    for row in Certificate.query.all():
        if (row.file_type or 'image') == 'image':
            targets.append(('certificates', row, 'file_url', 'certificates', 255))
    for row in Skill.query.all():
        targets.append(('skills', row, 'icon_url', 'skills', 255))
    return targets


def migrate(dry_run: bool = False, delete_originals: bool = False) -> int:
    app = create_app()
    uploads_root = (BASE_DIR / 'app' / 'static' / 'uploads').resolve()

    with app.app_context():
        targets = _collect_targets()
        converted_cache: dict[str, str] = {}
        written_files: list[Path] = []
        originals_to_delete: list[Path] = []
        total_before = 0
        total_after = 0
        converted_files_count = 0
        updated_rows_count = 0
        skipped_count = 0
        errors: list[str] = []

        for table_name, row, attr_name, folder_name, max_url_len in targets:
            old_url = getattr(row, attr_name)
            if not isinstance(old_url, str) or not old_url:
                skipped_count += 1
                continue

            prefix = f'/static/uploads/{folder_name}/'
            if not old_url.startswith(prefix):
                skipped_count += 1
                continue

            filename = old_url[len(prefix):]
            if not filename or '/' in filename or '\\' in filename:
                skipped_count += 1
                continue

            ext = Path(filename).suffix.lower()
            if ext not in RASTER_EXTENSIONS:
                skipped_count += 1
                continue

            if old_url in converted_cache:
                new_url = converted_cache[old_url]
                if not dry_run:
                    setattr(row, attr_name, new_url)
                updated_rows_count += 1
                print(f'  [REUSE] {table_name}#{row.id}: {old_url} -> {new_url}')
                continue

            directory = (uploads_root / folder_name).resolve()
            source_path = (directory / filename).resolve()
            if source_path.parent != directory or not source_path.is_file():
                errors.append(f'{table_name}#{row.id}: file not found on disk: {source_path}')
                continue

            cfg = FOLDER_CONFIG[folder_name]
            try:
                old_size = source_path.stat().st_size
                webp_bytes = convert_file_to_webp_bytes(
                    source_path,
                    max_dimension=cfg['max_dimension'],
                    quality=cfg['quality'],
                )
            except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
                errors.append(f'{table_name}#{row.id} ({old_url}): {exc}')
                continue

            new_filename = _choose_target_filename(directory, source_path, max_url_len)
            new_path = directory / new_filename
            new_url = f'{prefix}{new_filename}'
            new_size = len(webp_bytes)

            total_before += old_size
            total_after += new_size
            converted_files_count += 1
            updated_rows_count += 1
            converted_cache[old_url] = new_url

            saved_pct = (1 - (new_size / old_size)) * 100 if old_size else 0.0
            mode_tag = 'DRY-RUN' if dry_run else 'CONVERT'
            print(
                f'  [{mode_tag}] {table_name}#{row.id}: '
                f'{old_size / 1024:.1f} KB -> {new_size / 1024:.1f} KB ({saved_pct:+.1f}%) | '
                f'{old_url} -> {new_url}'
            )

            if not dry_run:
                new_path.write_bytes(webp_bytes)
                written_files.append(new_path)
                originals_to_delete.append(source_path)
                setattr(row, attr_name, new_url)

        if errors:
            print('\nErrors encountered:')
            for err in errors:
                print(f'  - {err}')

        if not dry_run:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
                for path in written_files:
                    if path.is_file():
                        path.unlink()
                raise

            if delete_originals:
                deleted_count = 0
                for old_path in originals_to_delete:
                    if old_path.is_file():
                        old_path.unlink()
                        deleted_count += 1
                print(f'\nDeleted {deleted_count} original raster file(s).')

        saved_bytes = total_before - total_after
        total_pct = (saved_bytes / total_before * 100) if total_before else 0.0
        print('\n=== Summary ===')
        print(f'Mode            : {"DRY-RUN (no changes written)" if dry_run else "APPLIED"}')
        print(f'Files converted : {converted_files_count}')
        print(f'DB rows updated : {updated_rows_count}')
        print(f'Skipped         : {skipped_count}')
        print(f'Errors          : {len(errors)}')
        print(
            f'Size change     : {total_before / 1024 / 1024:.2f} MB -> '
            f'{total_after / 1024 / 1024:.2f} MB '
            f'(saved {saved_bytes / 1024 / 1024:.2f} MB / {total_pct:.1f}%)'
        )
        return 1 if errors else 0


def main():
    parser = argparse.ArgumentParser(description='Migrate existing uploaded raster images to WebP.')
    parser.add_argument('--dry-run', action='store_true', help='Preview conversions without modifying files or database.')
    parser.add_argument('--delete-originals', action='store_true', help='Delete original files after DB commit succeeds.')
    args = parser.parse_args()
    raise SystemExit(migrate(dry_run=args.dry_run, delete_originals=args.delete_originals))


if __name__ == '__main__':
    main()
