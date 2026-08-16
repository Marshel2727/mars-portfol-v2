from app import db
from app.models.project import Project
from app.models.skill import Skill


def _normalize_tags(tags):
    if not isinstance(tags, list):
        return []

    normalized = []
    seen = set()
    for tag in tags:
        value = str(tag).strip()
        key = value.casefold()
        if value and key not in seen:
            normalized.append(value)
            seen.add(key)
    return normalized


def _normalize_architecture_steps(steps):
    if not isinstance(steps, list):
        return []

    normalized = []
    for index, step in enumerate(steps[:12]):
        if not isinstance(step, dict):
            continue
        title = str(step.get('title') or '').strip()
        description = str(step.get('description') or '').strip()
        if not title or not description:
            continue
        normalized.append({
            'label': str(step.get('label') or index + 1).strip(),
            'title': title,
            'description': description,
        })
    return normalized


def _get_skills(skill_ids):
    if not isinstance(skill_ids, list):
        return []

    normalized_ids = []
    for skill_id in skill_ids:
        try:
            normalized_ids.append(int(skill_id))
        except (TypeError, ValueError):
            continue

    if not normalized_ids:
        return []
    return Skill.query.filter(Skill.id.in_(normalized_ids)).all()

def get_all_projects():
    
    projects = Project.query.all()

    return [project.to_dict() for project in projects]

def get_project_by_id(project_id):
    
    project = db.session.get(Project, project_id)

    if project:
        return project.to_dict()
    return None

def create_project(data):
    
    new_project = Project(
        title = data.get('title'),
        sub_title = data.get('sub_title'),
        description = data.get('description'),
        image_url = data.get('image_url'),
        demo_url = data.get('demo_url'),
        github_url = data.get('github_url'),
        category = data.get('category') or 'Lainnya',
        tech_tags = _normalize_tags(data.get('tech_tags', [])),
        architecture_steps = _normalize_architecture_steps(data.get('architecture_steps', []))
    )
    new_project.skills = _get_skills(data.get('skill_ids', []))

    db.session.add(new_project)
    db.session.commit()

    return new_project.to_dict()

def update_project(project_id, data):

    project = db.session.get(Project, project_id)

    if not project:
        return None
    
    if 'title' in data:
        project.title = data['title']
    if 'sub_title' in data:
        project.sub_title = data['sub_title']
    if 'description' in data:
        project.description = data['description']
    if 'image_url' in data:
        project.image_url = data['image_url']
    if 'demo_url' in data:
        project.demo_url = data['demo_url']
    if 'github_url' in data:
        project.github_url = data['github_url']
    if 'category' in data:
        project.category = data['category'] or 'Lainnya'
    if 'tech_tags' in data:
        project.tech_tags = _normalize_tags(data['tech_tags'])
    if 'skill_ids' in data:
        project.skills = _get_skills(data['skill_ids'])
    if 'architecture_steps' in data:
        project.architecture_steps = _normalize_architecture_steps(data['architecture_steps'])
    
    db.session.commit()

    return project.to_dict()

def delete_project(project_id):
    
    project = db.session.get(Project, project_id)

    if project:
        db.session.delete(project)
        db.session.commit()
        return True
    return False
