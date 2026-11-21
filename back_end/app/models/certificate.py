from datetime import datetime

from app import db


class Certificate(db.Model):
    __tablename__ = 'certificates'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    issuer = db.Column(db.String(150), nullable=False)
    issue_date = db.Column(db.String(50))
    category = db.Column(db.String(100), nullable=False, default='Lainnya', server_default='Lainnya')
    credential_id = db.Column(db.String(120))
    credential_url = db.Column(db.String(500))
    description = db.Column(db.String(500))
    file_url = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(20), nullable=False, default='image', server_default='image')
    is_featured = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    display_order = db.Column(db.Integer, nullable=False, default=0, server_default='0')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Certificate: {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'issuer': self.issuer,
            'issue_date': self.issue_date,
            'category': self.category or 'Lainnya',
            'credential_id': self.credential_id,
            'credential_url': self.credential_url,
            'description': self.description,
            'file_url': self.file_url,
            'file_type': self.file_type or 'image',
            'is_featured': bool(self.is_featured),
            'display_order': self.display_order or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
