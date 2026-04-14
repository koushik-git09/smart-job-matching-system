import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import auth
from routes import dashboard
from routes import resume
from routes import jobs
from routes import match
from routes import learning
from routes import recruiter
from routes import chatbot


# Load backend/.env for local development (Render/Vercel should use platform env vars).
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=False)

app = FastAPI()


def _parse_csv_env(name: str) -> list[str]:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


cors_allow_origins = _parse_csv_env("CORS_ALLOW_ORIGINS") or [
    "http://localhost:5173",
    "https://smart-job-matching-system.vercel.app",
]
cors_allow_origin_regex = (os.getenv("CORS_ALLOW_ORIGIN_REGEX") or "").strip() or None

app.include_router(dashboard.router)
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(match.router, prefix="/match", tags=["Matching"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])
app.include_router(recruiter.router, prefix="/recruiter", tags=["Recruiter"])
app.include_router(chatbot.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_origin_regex=cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Job Fit AI Backend Running"}
