from app import db
from datetime import datetime

class ProjectImage(db.Model):
    __tablename__ = "project_image"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(150))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default = datetime.utcnow, onupdate = datetime.utcnow)

    def __repr__(self):
        return f'<ProjectImage: Project {self.project_id} - {self.caption}>'
    
    def to_dict(self):
        return{
            'id': self.id,
            'project_id': self.project_id,
            'image_url': self.image_url,
            'caption': self.caption,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
