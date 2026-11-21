from app import db
from app.models.certificate import Certificate


def get_all_certificates():
    certificates = Certificate.query.order_by(
        Certificate.is_featured.desc(),
        Certificate.display_order.asc(),
        Certificate.id.desc(),
    ).all()
    return [certificate.to_dict() for certificate in certificates]


def get_certificate_by_id(cert_id):
    certificate = db.session.get(Certificate, cert_id)
    if certificate:
        return certificate.to_dict()
    return None


def create_certificate(data):
    new_certificate = Certificate(
        title=data.get('title'),
        issuer=data.get('issuer'),
        issue_date=data.get('issue_date'),
        category=data.get('category') or 'Lainnya',
        credential_id=data.get('credential_id'),
        credential_url=data.get('credential_url'),
        description=data.get('description'),
        file_url=data.get('file_url'),
        file_type=data.get('file_type') or 'image',
        is_featured=bool(data.get('is_featured', False)),
        display_order=data.get('display_order', 0),
    )
    db.session.add(new_certificate)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return new_certificate.to_dict()


def update_certificate(cert_id, data):
    certificate = db.session.get(Certificate, cert_id)
    if not certificate:
        return None

    allowed_fields = (
        'title',
        'issuer',
        'issue_date',
        'category',
        'credential_id',
        'credential_url',
        'description',
        'file_url',
        'file_type',
        'is_featured',
        'display_order',
    )
    for field in allowed_fields:
        if field in data:
            value = (data[field] or 'Lainnya') if field == 'category' else data[field]
            setattr(certificate, field, value)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return certificate.to_dict()


def delete_certificate(cert_id):
    certificate = db.session.get(Certificate, cert_id)
    if not certificate:
        return False

    db.session.delete(certificate)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return True
