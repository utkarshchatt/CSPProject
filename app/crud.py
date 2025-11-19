from sqlalchemy.orm import Session
from . import models, schemas

def get_roles(db: Session, skip=0, limit=10):
    return db.query(models.Role).offset(skip).limit(limit).all()

def get_role_by_slug(db: Session, slug: str):
    return db.query(models.Role).filter(models.Role.slug == slug).first()
