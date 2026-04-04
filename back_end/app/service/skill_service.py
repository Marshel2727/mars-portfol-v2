from app import db
from app.models.skill import Skill

def get_all_skill():
    
    data = Skill.query.all()

    return 
        