from fastapi import APIRouter
from app.services.json_loader import load_json

router = APIRouter(prefix="/roles", tags=["Roles"])

@router.get("/")
def get_roles(search: str = None):
    roles = load_json("jobs.json")

    if search:
        s = search.lower()
        roles = [r for r in roles if s in r["title"].lower()]

    return roles


@router.get("/{slug}")
def get_role(slug: str):
    roles = load_json("jobs.json")

    for role in roles:
        if role["slug"] == slug:
            return role

    return {"error": "Role not found"}
