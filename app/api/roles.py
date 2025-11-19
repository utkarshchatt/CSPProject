from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Role
from ..schemas import RoleCreate, RoleOut

router = APIRouter(prefix="/roles", tags=["Roles"])

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------
# GET /roles  (with search)
# -------------------
@router.get("/", response_model=list[RoleOut])
def read_roles(search: str = None, db: Session = Depends(get_db)):
    
    query = db.query(Role)

    if search:
        search = f"%{search.lower()}%"
        query = query.filter(Role.title.ilike(search))

    return query.all()


# -------------------
# GET /roles/{slug}
# -------------------
@router.get("/{slug}", response_model=RoleOut)
def read_role(slug: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.slug == slug).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


# -------------------
# POST /roles
# -------------------
@router.post("/", response_model=RoleOut)
def create_role(role_data: RoleCreate, db: Session = Depends(get_db)):
    existing = db.query(Role).filter(Role.slug == role_data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")

    new_role = Role(**role_data.dict())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


# -------------------
# PUT /roles/{slug}
# -------------------
@router.put("/{slug}", response_model=RoleOut)
def update_role(slug: str, role_data: RoleCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.slug == slug).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    for key, value in role_data.dict().items():
        setattr(role, key, value)

    db.commit()
    db.refresh(role)
    return role


# -------------------
# DELETE /roles/{slug}
# -------------------
@router.delete("/{slug}")
def delete_role(slug: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.slug == slug).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"}
