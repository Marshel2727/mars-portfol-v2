from app import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    sub_title = db.Column(db.String(150))
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(150), nullable=False)
    demo_url = db.Column(db.String(150))
    github_url = db.Column(db.String(150))
    created_at = db.Column(db.DateTime, default = datetime.utcnow)
    updated_at = db.Column(db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow)

    gallery = db.relationship('ProjectImage', backref='project', lazy=True, cascade="all, delete-orphan")

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
            'created_at': self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            'updated_at': self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,

            'gallery':[img.to_dict() for img in self.gallery]
        }