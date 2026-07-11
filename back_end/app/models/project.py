from app import db
from datetime import datetime

project_skills = db.Table(
    'project_skills',
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True)
)


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    sub_title = db.Column(db.String(150))
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(150), nullable=False)
    demo_url = db.Column(db.String(150))
    github_url = db.Column(db.String(150))
    category = db.Column(db.String(100), nullable=False, default='Lainnya')
    tech_tags = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.DateTime, default = datetime.utcnow)
    updated_at = db.Column(db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow)

    gallery = db.relationship('ProjectImage', backref='project', lazy=True, cascade="all, delete-orphan")
    skills = db.relationship(
        'Skill',
        secondary=project_skills,
        back_populates='projects',
        lazy='select'
    )

    def __repr__(self):
        return f'<project : {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'sub_title': self.sub_title,
            'description': self.description,
            'image_url': self.image_url,
            'demo_url': self.demo_url,
            'github_url': self.github_url,
            'category': self.category,
            'tech_tags': self.tech_tags or [],
            'created_at': self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            'updated_at': self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,

            'gallery': [img.to_dict() for img in self.gallery],
            'skills': [
                {
                    'id': skill.id,
                    'name': skill.name,
                    'level': skill.level,
                    'category': skill.category,
                    'icon_url': skill.icon_url
                }
                for skill in self.skills
            ]
        }
