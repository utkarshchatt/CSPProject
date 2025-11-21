from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import os

app = FastAPI()

# CORS (allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_json(filename):
    with open(os.path.join(DATA_DIR, filename), "r") as f:
        return json.load(f)

# -------------------------
#   ROUTES
# -------------------------

@app.get("/roles")
def get_roles(search: str = Query(None)):
    roles = load_json("jobs.json")
    
    # If search parameter provided, filter roles
    if search:
        search_lower = search.lower()
        roles = [
            role for role in roles 
            if search_lower in role["title"].lower() or 
               search_lower in role.get("description", "").lower()
        ]
    
    return roles

@app.get("/roles/{slug}")
def get_role(slug: str):
    roles = load_json("jobs.json")
    for role in roles:
        if role["slug"] == slug:
            return role
    return {"error": "Role not found"}

@app.get("/guide/questions")
def guide_questions():
    return load_json("guideQuiz.json")

@app.post("/guide/recommend")
def recommend(data: dict):
    # Get the answers from the payload
    answers = data.get("answers", [])
    
    # Load roles/jobs data
    roles = load_json("jobs.json")
    
    # Simple scoring logic - you can enhance this
    recommendations = [
        {"role": "Software Engineer", "match_score": 87},
        {"role": "Data Scientist", "match_score": 80},
        {"role": "UX Designer", "match_score": 75}
    ]
    
    return {"recommendations": recommendations}

@app.get("/roadmap")
def get_roadmap():
    return load_json("skills.json")

# Serve frontend files
# Get the parent directory (go up one level from 'app' folder)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)