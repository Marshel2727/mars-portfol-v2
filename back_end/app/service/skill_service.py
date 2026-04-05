from app import db
from app.models.skill import Skill

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
        icon_url = data.get('icon_url')
    )

    db.session.add(new_skill)
    db.session.commit()

    return new_skill.to_dict()

def update_skill(skill_id, data):

    skill = db.session.get(Skill, skill_id)

    if not skill:
        return None
    
    allowed_filed=['name', 'level', 'icon_url']

    for key, value  in data.items():
        if key in allowed_filed:
            setattr(skill, key, value)

    db.session.commit()
    return skill.to_dict()

def delete_skill(skill_id):
    skill = db.session.get(Skill, skill_id)

    if skill:
        db.session.delete(skill)
        db.session.commit()
        return True
    return False