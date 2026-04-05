from flask import Blueprint,jsonify,request
from app.service.skill_service import get_all_skill,get_skill_by_id,create_skill,update_skill,delete_skill


skill_bp = Blueprint('skill_bp', __name__, url_prefix='/api/skills')

@skill_bp.route('/', methods=['GET'])
def fetch_all_skills():
    skills = get_all_skill()

    return jsonify({
        status
    })
