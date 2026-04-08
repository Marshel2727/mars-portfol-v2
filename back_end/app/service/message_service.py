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

