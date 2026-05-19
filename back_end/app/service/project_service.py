from app import db
from app.models.project import Project

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
        github_url = data.get('github_url')
    )

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
    
    db.session.commit()

    return project.to_dict()

def delete_project(project_id):
    
    project = db.session.get(Project, project_id)

    if project:
        db.session.delete(project)
        db.session.commit()
        return True
    return False