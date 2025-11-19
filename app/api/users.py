from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import User, UserResult
from ..schemas import UserCreate, UserOut, UserResultOut

router = APIRouter(prefix="/users", tags=["Users"])

# --------------------------
# Dependency for DB Session
# --------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------
# Create a new user
# --------------------------
@router.post("/", response_model=UserOut)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(**user_data.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --------------------------
# Get all users
# --------------------------
@router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


# --------------------------
# Get a user’s quiz results
# --------------------------
@router.get("/{user_id}/results", response_model=list[UserResultOut])
def get_user_results(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(UserResult).filter(UserResult.user_id == user_id).all()
