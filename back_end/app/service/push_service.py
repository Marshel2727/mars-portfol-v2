import json
from flask import current_app
from pywebpush import webpush, WebPushException
from app import db
from app.models.push_subscription import PushSubscription

def send_push_notification(subscription, payload_data):
    """
    Sends a push notification to a specific subscription.
    If the subscription is no longer valid (expired/uninstalled), it is deleted from the database.
    """
    try:
        # Load VAPID config
        private_key = current_app.config.get('VAPID_PRIVATE_KEY')
        public_key = current_app.config.get('VAPID_PUBLIC_KEY')
        claims_email = current_app.config.get('VAPID_CLAIM_EMAIL')

        if not private_key or not public_key:
            current_app.logger.warning("VAPID keys not configured. Skipping push notification.")
            return False

        # Prepare subscription info
        subscription_info = json.loads(subscription.subscription_json)

        # Send push notification
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload_data),
            vapid_private_key=private_key,
            vapid_claims={
                "sub": claims_email
            }
        )
        return True

    except WebPushException as ex:
        # If subscription has expired or is invalid (410 Gone / 404 Not Found), clean it up from database
        if ex.response is not None and ex.response.status_code in [404, 410]:
            current_app.logger.info(f"Subscription expired (status {ex.response.status_code}). Deleting subscription ID: {subscription.id}")
            try:
                db.session.delete(subscription)
                db.session.commit()
            except Exception as delete_ex:
                db.session.rollback()
                current_app.logger.error(f"Failed to delete expired subscription: {delete_ex}")
        else:
            current_app.logger.error(f"WebPushException sending push: {ex}")
        return False
    except Exception as ex:
        current_app.logger.error(f"Unexpected error sending push notification: {ex}")
        return False

def broadcast_push_to_admin(payload_data):
    """
    Sends a push notification to all active admin subscriptions.
    """
    # Find all subscriptions belonging to users with role 'admin'
    from app.models.user import User
    
    admin_subscriptions = PushSubscription.query.join(User).filter(User.role == 'admin').all()
    
    if not admin_subscriptions:
        current_app.logger.info("No active admin push subscriptions found.")
        return

    success_count = 0
    for sub in admin_subscriptions:
        if send_push_notification(sub, payload_data):
            success_count += 1
            
    current_app.logger.info(f"Broadcasted push notification to {success_count}/{len(admin_subscriptions)} admin devices.")
