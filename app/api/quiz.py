from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Role, UserResult
from ..schemas import QuizSubmission, UserResultOut
from typing import List

router = APIRouter(prefix="/quiz", tags=["Quiz"])


# -------------------- SUBMIT QUIZ --------------------
@router.post("/submit", response_model=UserResultOut)
def submit_quiz(user_id: int, submission: QuizSubmission, db: Session = Depends(get_db)):

    # 1) Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_answers = submission.answers

    # 2) Fetch all roles
    roles = db.query(Role).all()

    recommendations = []

    # 3) Scoring logic
    for role in roles:
        score = 0
        if role.traits:
            for trait, weight in user_answers.items():
                score += role.traits.get(trait, 0) * weight

        recommendations.append({
            "role_id": role.id,
            "title": role.title,
            "score": score
        })

    recommendations.sort(key=lambda r: r["score"], reverse=True)
    top_roles = recommendations[:3]

    # 4) Save result
    result = UserResult(
        user_id=user_id,
        answers=user_answers,
        recommendations=top_roles,
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return result


# -------------------- GET ALL RESULTS --------------------
@router.get("/results/{user_id}", response_model=List[UserResultOut])
def get_all_results(user_id: int, db: Session = Depends(get_db)):

    results = (
        db.query(UserResult)
        .filter(UserResult.user_id == user_id)
        .order_by(UserResult.created_at.desc())
        .all()
    )

    if not results:
        raise HTTPException(status_code=404, detail="No results found for this user")

    return results


# -------------------- GET LATEST RESULT --------------------
@router.get("/results/{user_id}/latest", response_model=UserResultOut)
def get_latest_result(user_id: int, db: Session = Depends(get_db)):

    result = (
        db.query(UserResult)
        .filter(UserResult.user_id == user_id)
        .order_by(UserResult.created_at.desc())
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="No results found for this user")

    return result
