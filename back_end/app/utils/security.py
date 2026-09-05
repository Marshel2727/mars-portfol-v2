"""Small, process-shared security store for a single-host deployment."""
import hashlib
import hmac
import math
import sqlite3
import time
from contextlib import contextmanager
from functools import wraps
from pathlib import Path

from flask import current_app, jsonify, request


@contextmanager
def security_store():
    path = Path(current_app.config.get('SECURITY_STORE_PATH') or
                Path(current_app.instance_path) / 'security.sqlite3')
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=5)
    try:
        connection.execute('CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER, expires REAL)')
        connection.execute('CREATE TABLE IF NOT EXISTS revoked (jti TEXT PRIMARY KEY, expires REAL)')
        with connection:
            yield connection
    finally:
        connection.close()


def consume_limits(rules, now=None):
    """Atomically check and charge every bucket, shared by all Gunicorn workers."""
    now = time.time() if now is None else now
    with security_store() as store:
        store.execute('BEGIN IMMEDIATE')
        store.execute('DELETE FROM limits WHERE expires <= ?', (now,))
        store.execute('DELETE FROM revoked WHERE expires <= ?', (now,))
        buckets = []
        for key, maximum, seconds in rules:
            key = hmac.new(current_app.config['JWT_SECRET_KEY'].encode(), key.encode(), hashlib.sha256).hexdigest()
            row = store.execute('SELECT count, expires FROM limits WHERE key = ?', (key,)).fetchone()
            if row and row[0] >= maximum:
                return max(1, math.ceil(row[1] - now))
            buckets.append((key, (row[0] if row else 0) + 1, row[1] if row else now + seconds))
        store.executemany('INSERT OR REPLACE INTO limits VALUES (?, ?, ?)', buckets)
    return 0


def rate_limit(kind):
    def decorate(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            address = request.remote_addr or 'unknown'
            if kind == 'login':
                data = request.get_json(silent=True)
                email = data.get('email', '') if isinstance(data, dict) else ''
                email = email.strip().lower()[:255] if isinstance(email, str) else ''
                rules = [(f'login:ip:{address}', 30, 900), (f'login:account:{email}', 10, 900)]
            else:
                rules = [(f'{kind}:ip:{address}', 5, 600)]
            try:
                retry = consume_limits(rules)
            except (sqlite3.Error, OSError):
                current_app.logger.exception('Security rate limiter unavailable')
                return jsonify(status='error', message='Layanan sementara tidak tersedia.'), 503
            if retry:
                response = jsonify(status='error', message='Terlalu banyak permintaan. Silakan coba lagi nanti.')
                response.status_code = 429
                response.headers['Retry-After'] = str(retry)
                return response
            return view(*args, **kwargs)
        return wrapped
    return decorate


def revoke_token(token):
    with security_store() as store:
        store.execute('INSERT OR REPLACE INTO revoked VALUES (?, ?)', (token['jti'], token['exp']))


def token_revoked(_header, token):
    try:
        with security_store() as store:
            return store.execute('SELECT 1 FROM revoked WHERE jti = ? AND expires > ?',
                                 (token['jti'], time.time())).fetchone() is not None
    except (sqlite3.Error, OSError):
        current_app.logger.exception('Session revocation store unavailable')
        return True
