from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth
from routes import dashboard
from routes import resume
from routes import jobs
from routes import match
from routes import learning
from routes import recruiter

app = FastAPI()

app.include_router(dashboard.router)
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(match.router, prefix="/match", tags=["Matching"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])
app.include_router(recruiter.router, prefix="/recruiter", tags=["Recruiter"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Job Fit AI Backend Running"}
