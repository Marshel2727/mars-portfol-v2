from app import db
from app.models.about_profile import AboutProfile


DEFAULT_ABOUT_PROFILE = {
    'id': 1,
    'full_name': 'Marshel',
    'headline': 'Full-Stack Developer & IoT Enthusiast',
    'bio': (
        'Saya adalah mahasiswa Teknik Komputer yang menikmati proses mengubah '
        'kebutuhan nyata menjadi aplikasi yang dapat digunakan. Saya terbiasa '
        'mengerjakan antarmuka, backend, database, deployment, hingga integrasi perangkat IoT.'
    ),
    'education': 'Mahasiswa Teknik Komputer',
    'location': 'Indonesia',
    'current_focus': (
        'Memperkuat kemampuan full-stack development dan membangun sistem yang '
        'stabil, mudah dipelihara, serta relevan bagi penggunanya.'
    ),
    'cv_url': None,
    'profile_image_url': None,
    'created_at': None,
    'updated_at': None,
}


def get_about_profile():
    profile = db.session.get(AboutProfile, 1)
    return profile.to_dict() if profile else DEFAULT_ABOUT_PROFILE.copy()


def update_about_profile(data):
    profile = db.session.get(AboutProfile, 1)
    if not profile:
        profile = AboutProfile(id=1)
        db.session.add(profile)

    allowed_fields = [
        'full_name',
        'headline',
        'bio',
        'education',
        'location',
        'current_focus',
        'cv_url',
        'profile_image_url',
    ]
    for field in allowed_fields:
        if field in data:
            setattr(profile, field, data[field] or None)

    profile.full_name = profile.full_name or DEFAULT_ABOUT_PROFILE['full_name']
    profile.headline = profile.headline or DEFAULT_ABOUT_PROFILE['headline']
    profile.bio = profile.bio or DEFAULT_ABOUT_PROFILE['bio']

    db.session.commit()
    return profile.to_dict()
