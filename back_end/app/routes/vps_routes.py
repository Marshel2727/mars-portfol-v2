from flask import Blueprint, request
from flask_jwt_extended import get_jwt, jwt_required

from app.service.vps_service import VpsMonitorError, fetch_vps_metrics
from app.utils.response import error_response, success_response


vps_bp = Blueprint('vps_bp', __name__, url_prefix='/api/vps')


@vps_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_vps_metrics():
    if get_jwt().get('role') != 'admin':
        return error_response(
            message='Akses ditolak! Hanya admin yang boleh mengakses.',
            status_code=403,
        )

    fresh = request.args.get('fresh', '').strip().lower() in ('1', 'true', 'yes')
    try:
        metrics = fetch_vps_metrics(force_refresh=fresh)
    except VpsMonitorError as exc:
        return error_response(message=exc.message, status_code=exc.status_code)

    return success_response(data=metrics)
