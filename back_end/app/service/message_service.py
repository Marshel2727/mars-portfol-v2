from app import db
from app.models.message import Message

def get_all_messages():
    
    messgaes = Message.query.all()

    return [message.to_dict() for message in messgaes]

def get_message_by_id(message_id):
    
    message = db.session.get(Message, message_id)

    if message:
        return message.to_dict()
    return None

def create_message(data):
    
    new_message = Message(
        name = data.get('name'),
        email = data.get('email'),
        content = data.get('content')
    )

    db.session.add(new_message)
    db.session.commit()

    # Trigger push notification to admin
    try:
        from app.service.push_service import broadcast_push_to_admin
        payload = {
            "title": f"Pesan Baru: {new_message.name}",
            "body": new_message.content[:80] + ("..." if len(new_message.content) > 80 else ""),
            "url": f"/admin/messages"
        }
        broadcast_push_to_admin(payload)
    except Exception as e:
        # Don't let push notification failure block the client's request
        from flask import current_app
        current_app.logger.error(f"Error triggering push broadcast: {e}")

    return new_message.to_dict()

def mark_as_read(message_id):
    
    message = db.session.get(Message, message_id)

    if message:
        message.is_read = True
        db.session.commit()
        return message.to_dict()
    
    return None


def delete_message(message_id):
    
    message = db.session.get(Message, message_id)

    if message:
        db.session.delete(message)
        db.session.commit()
        return message.to_dict()
    return None

