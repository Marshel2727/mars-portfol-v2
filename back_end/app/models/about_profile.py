from datetime import datetime

from app import db


class AboutProfile(db.Model):
    __tablename__ = 'about_profiles'

    id = db.Column(db.Integer, primary_key=True, default=1)
    full_name = db.Column(db.String(120), nullable=False, default='Marshel')
    headline = db.Column(db.String(180), nullable=False)
    bio = db.Column(db.Text, nullable=False)
    education = db.Column(db.String(180))
    location = db.Column(db.String(120))
    current_focus = db.Column(db.Text)
    cv_url = db.Column(db.String(255))
    profile_image_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'headline': self.headline,
            'bio': self.bio,
            'education': self.education,
            'location': self.location,
            'current_focus': self.current_focus,
            'cv_url': self.cv_url,
            'profile_image_url': self.profile_image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
