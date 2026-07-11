from functools import wraps

from flask import make_response, request


def public_cache(seconds=60, stale_seconds=300):
    """Cache public GET responses while keeping authenticated reads fresh."""
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            response = make_response(view(*args, **kwargs))

            if response.status_code == 200:
                response.headers['Cache-Control'] = (
                    f'public, max-age=0, s-maxage={seconds}, '
                    f'stale-while-revalidate={stale_seconds}, must-revalidate'
                )
                response.headers['Vary'] = 'Origin, Accept-Encoding'
                response.add_etag()
                response.make_conditional(request)

            return response
        return wrapped
    return decorator
