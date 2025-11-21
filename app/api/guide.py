from fastapi import APIRouter
from app.services.json_loader import load_json

router = APIRouter(prefix="/guide", tags=["Guide Quiz"])

@router.get("/questions")
def get_questions():
    return load_json("guide_questions.json")


@router.post("/recommend")
def get_recommendations(payload: dict):
    answers = payload["answers"]

    roles = load_json("roles.json")
    questions = load_json("guide_questions.json")["questions"]

    scores = {}

    # Calculate a simple match score
    for role in roles:
        total = 0
        for ans in answers:
            q_id = ans["question_id"]
            q_score = ans["score"]

            total += q_score

        scores[role["title"]] = total

    # sort best matches
    sorted_roles = sorted(scores.items(), key=lambda x: -x[1])

    result = [
        {"role": r[0], "match_score": r[1]} for r in sorted_roles[:5]
    ]

    return {"recommendations": result}
