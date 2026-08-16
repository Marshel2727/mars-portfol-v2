from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

def has_registered_users():
    return User.query.first() is not None


def register_user(data, role='user'):
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    
    if User.query.filter_by(email=email).first():
        return {
            'status': 'error',
            'message': 'email sudah digunakan sebelumnya!'
        }, 400
    
    if User.query.filter_by(username=username).first():
        return {
            'status': 'error',
            'message': 'username sudah digunakan sebelumnya!'
        }, 400
    
    new_user = User(
        username=username,
        email=email,
        role=role
    )

    new_user.set_password(data.get('password'))

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {
            'status': 'error',
            'message': 'Username atau email sudah digunakan.'
        }, 409

    return {
        'status': 'success',
        'data': new_user.to_dict()
    }, 201

def verify_login(email, password):
    normalized_email = email.strip().lower()
    user = User.query.filter_by(email=normalized_email).first()

    if not user or not user.check_password(password):
        return {
            'status': 'error',
            'message': 'Email atau password salah!'
        }, 401
    
    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={'role': user.role}
    )
    
    return {
        'status': 'success',
        'message': 'login success',
        'data': user.to_dict(),
        'access_token': access_token
    }, 200

def subscribe_push(user_id, subscription_info):
    import json
    from app.models.push_subscription import PushSubscription

    endpoint = subscription_info.get('endpoint')
    if not endpoint:
        return {
            'status': 'error',
            'message': 'Endpoint tidak valid!'
        }, 400

    # Check for existing subscription for this endpoint
    existing_subs = PushSubscription.query.filter_by(user_id=user_id).all()
    for sub in existing_subs:
        try:
            info = json.loads(sub.subscription_json)
            if info.get('endpoint') == endpoint:
                return {
                    'status': 'success',
                    'message': 'Perangkat sudah terdaftar sebelumnya.',
                    'data': sub.to_dict()
                }, 200
        except Exception:
            pass

    # Create new subscription
    new_sub = PushSubscription(
        user_id=user_id,
        subscription_json=json.dumps(subscription_info)
    )
    
    try:
        db.session.add(new_sub)
        db.session.commit()
        return {
            'status': 'success',
            'message': 'Notifikasi HP berhasil diaktifkan!',
            'data': new_sub.to_dict()
        }, 201
    except Exception as e:
        db.session.rollback()
        return {
            'status': 'error',
            'message': f'Gagal mengaktifkan notifikasi: {str(e)}'
        }, 500

