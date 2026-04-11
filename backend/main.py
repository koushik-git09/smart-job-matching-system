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


# Load backend/.env for local development (Render/Vercel should use platform env vars).
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=False)

app = FastAPI()

app.include_router(dashboard.router)
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(match.router, prefix="/match", tags=["Matching"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])
app.include_router(recruiter.router, prefix="/recruiter", tags=["Recruiter"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o.strip()
        for o in os.getenv(
            "CORS_ALLOW_ORIGINS",
            "http://localhost:5173,http://localhost:3000",
        ).split(",")
        if o.strip()
    ],
    allow_origin_regex=os.getenv("CORS_ALLOW_ORIGIN_REGEX") or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Job Fit AI Backend Running"}
