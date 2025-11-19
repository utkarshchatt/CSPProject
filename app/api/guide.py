from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(prefix="/guide", tags=["Career Guide"])

# ---------------------------
# 1️⃣ Quiz questions
# ---------------------------
QUESTIONS = [
    {"id": 1, "question": "Do you enjoy solving logical or analytical problems?", "trait": "technical"},
    {"id": 2, "question": "Do you like working with people and helping others?", "trait": "people"},
    {"id": 3, "question": "Do you prefer a creative and flexible work environment?", "trait": "creative"},
    {"id": 4, "question": "Is a high, stable income important to you?", "trait": "income"},
    {"id": 5, "question": "Do you like working with technology or data?", "trait": "technology"}
]

# ---------------------------
# 2️⃣ Role profiles — trait mapping
# ---------------------------
ROLE_PROFILES = {
    "Software Engineer": {"technical": 5, "people": 2, "creative": 3, "income": 4, "technology": 5},
    "Doctor": {"technical": 4, "people": 5, "creative": 2, "income": 5, "technology": 3},
    "Graphic Designer": {"technical": 2, "people": 3, "creative": 5, "income": 3, "technology": 3},
    "Teacher": {"technical": 3, "people": 5, "creative": 4, "income": 3, "technology": 2},
    "Data Scientist": {"technical": 5, "people": 3, "creative": 3, "income": 5, "technology": 5}
}

# ---------------------------
# 3️⃣ Request schema
# ---------------------------
class Answer(BaseModel):
    question_id: int
    score: int  # 1–5 scale

class GuideRequest(BaseModel):
    answers: List[Answer]

# ---------------------------
# 4️⃣ GET endpoint — return questions
# ---------------------------
@router.get("/questions")
def get_questions():
    return {"questions": QUESTIONS}

# ---------------------------
# 5️⃣ POST endpoint — recommendation logic
# ---------------------------
@router.post("/recommend")
def get_recommendations(payload: GuideRequest):
    # Initialize trait totals
    traits = {"technical": 0, "people": 0, "creative": 0, "income": 0, "technology": 0}

    # Aggregate user responses by trait
    for ans in payload.answers:
        q = next((q for q in QUESTIONS if q["id"] == ans.question_id), None)
        if q:
            traits[q["trait"]] += ans.score

    # Compare user traits to each role profile
    results = []
    for role, profile in ROLE_PROFILES.items():
        match = sum(min(traits[t], profile[t]) for t in traits)
        results.append({"role": role, "match_score": match})

    # Sort top 3 matches
    top_matches = sorted(results, key=lambda x: x["match_score"], reverse=True)[:3]

    return {"user_traits": traits, "recommendations": top_matches}
