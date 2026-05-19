from app import db
from app.models.project_image import ProjectImage

def add_project_image(project_id, image_url, caption=None):
    new_image = ProjectImage(
        project_id=project_id,
        image_url=image_url,
        caption=caption
    )

    db.session.add(new_image)
    db.session.commit()

def delete_project_image(image_id):
    image = db.session.get(ProjectImage, image_id)

    if image:
        db.session.delete(image)
        db.session.commit()
        return True
    return False
