import json
from app import db
from datetime import datetime

class PushSubscription(db.Model):
    __tablename__ = 'push_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subscription_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('push_subscriptions', lazy=True, cascade='all, delete-orphan'))

    def __repr__(self):
        return f'<PushSubscription id: {self.id} user_id: {self.user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_info': json.loads(self.subscription_json),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
