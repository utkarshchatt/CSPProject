
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from fastapi import FastAPI
from .api import roles, guide, users, quiz

app = FastAPI(title="Career Dashboard API")

# Path to frontend folder
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
frontend_path = os.path.abspath(frontend_path)

# Serve static files (CSS, JS, JSON files)
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

# Serve index.html at root
@app.get("/", include_in_schema=False)
def serve_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))


app.include_router(roles.router)
app.include_router(guide.router)
app.include_router(users.router)
app.include_router(quiz.router)


@app.get("/")
def root():
    return {"message": "Career Dashboard Backend Running 🚀"}
