from fastapi import APIRouter
from app.services.json_loader import load_json

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

@router.get("/")
def get_all_roadmaps():
    return load_json("roles.json")  # reuse roles
