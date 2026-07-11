from app import db
from app.models.skill import Skill
from app.models.project import Project


def _get_projects(project_ids):
    if not isinstance(project_ids, list):
        return []

    normalized_ids = []
    for project_id in project_ids:
        try:
            normalized_ids.append(int(project_id))
        except (TypeError, ValueError):
            continue

    if not normalized_ids:
        return []
    return Project.query.filter(Project.id.in_(normalized_ids)).all()

def get_all_skill():
    
    skills = Skill.query.all()

    return [skill.to_dict() for skill in skills]

def get_skill_by_id(skill_id):
    
    skill = db.session.get(Skill, skill_id)

    if skill:
        return skill.to_dict()
    return None

def create_skill(data):
    new_skill = Skill (
        name = data.get('name'),
        level = data.get('level'),
        icon_url = data.get('icon_url'),
        category = data.get('category') or 'Lainnya'
    )
    new_skill.projects = _get_projects(data.get('project_ids', []))

    db.session.add(new_skill)
    db.session.commit()

    return new_skill.to_dict()

def update_skill(skill_id, data):

    skill = db.session.get(Skill, skill_id)

    if not skill:
        return None
    
    allowed_filed=['name', 'level', 'icon_url', 'category']

    for key, value  in data.items():
        if key in allowed_filed:
            setattr(skill, key, value)

    if 'project_ids' in data:
        skill.projects = _get_projects(data['project_ids'])

    db.session.commit()
    return skill.to_dict()

def delete_skill(skill_id):
    skill = db.session.get(Skill, skill_id)

    if skill:
        db.session.delete(skill)
        db.session.commit()
        return True
    return False
