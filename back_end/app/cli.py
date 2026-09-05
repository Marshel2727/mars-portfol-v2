import re
import click
from flask.cli import with_appcontext
from app.service.auth_service import has_registered_users, register_user


@click.command('create-admin')
@click.option('--username', prompt=True)
@click.option('--email', prompt=True)
@click.password_option()
@with_appcontext
def create_admin(username, email, password):
    """Create the first admin locally; never expose bootstrap over HTTP."""
    if has_registered_users():
        raise click.ClickException('Akun sudah ada. Gunakan admin yang sudah terdaftar.')
    if not username.strip() or len(username.strip()) > 255:
        raise click.ClickException('Username wajib diisi, maksimal 255 karakter.')
    if len(email) > 255 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email.strip()):
        raise click.ClickException('Email tidak valid.')
    if not 12 <= len(password) <= 128:
        raise click.ClickException('Password harus 12 sampai 128 karakter.')
    result, status = register_user(dict(username=username, email=email, password=password), role='admin')
    if status != 201:
        raise click.ClickException(result.get('message', 'Gagal membuat admin.'))
    click.echo('Admin berhasil dibuat.')
