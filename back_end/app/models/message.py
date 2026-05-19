from app import db
from datetime import datetime

class Message(db.Model):
    __tablename__='messages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(225))
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<name: {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'content': self.content,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }