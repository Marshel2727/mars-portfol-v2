from app import db
from datetime import datetime

class Skill(db.Model):
    __tablename__ = 'skills'

    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(200), nullable= False)
    level = db.Column(db.String(200))
    icon_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate = datetime.utcnow)

    def __repr__(self):
        return f'<Skill: {self.nama}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'level': self.level,
            'icon_url': self.icon_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }