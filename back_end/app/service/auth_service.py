from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token

def register_user(data):
    
    if User.query.filter_by(email=data.get('email')).first():
        return {
            'status': 'error',
            'message': 'email sudah digunakan sebelumnya!'
        }, 400
    
    if User.query.filter_by(username=data.get('username')).first():
        return {
            'status': 'error',
            'message': 'username sudah digunakan sebelumnya!'
        }, 400
    
    new_user = User(
        username = data.get('username'),
        email = data.get('email'),
        role = data.get('role')
    )

    new_user.set_password(data.get('password'))

    db.session.add(new_user)
    db.session.commit()

    return {
        'status': 'success',
        'data': new_user.to_dict()
    }, 201

def verify_login(email, password):
    
    user = User.query.filter_by(email = email).first()

    if not user or not user.check_password(password):
        return {
            'status': 'error',
            'message': 'Email atu password salah!'
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

