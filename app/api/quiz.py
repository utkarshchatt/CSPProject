from fastapi import APIRouter

router = APIRouter(prefix="/quiz", tags=["Personality Quiz"])

@router.post("/submit")
def submit_quiz(user_id: int, answers: dict):
    return {"status": "ok", "user_id": user_id, "answers": answers}
