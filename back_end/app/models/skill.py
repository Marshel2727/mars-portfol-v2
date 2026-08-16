from app import db
from datetime import datetime

class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(200), nullable= False)
    level = db.Column(db.String(200))
    icon_url = db.Column(db.String(255))
    category = db.Column(db.String(100), nullable=False, default='Lainnya')
    detail = db.Column(db.String(180))
    proficiency = db.Column(db.Integer)
    years_experience = db.Column(db.String(50))
    display_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate = datetime.utcnow)

    projects = db.relationship(
        'Project',
        secondary='project_skills',
        back_populates='skills',
        lazy='select'
    )

    def __repr__(self):
        return f'<Skill: {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'icon_url': self.icon_url,
            'category': self.category,
            'detail': self.detail,
            'proficiency': self.proficiency,
            'years_experience': self.years_experience,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'projects': [
                {
                    'id': project.id,
                    'title': project.title,
                    'category': project.category,
                    'tech_tags': project.tech_tags or [],
                    'image_url': project.image_url
                }
                for project in self.projects
            ]
        }
