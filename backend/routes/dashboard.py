from fastapi import APIRouter, Depends
from models.token import require_role
from services.firebase import db
from datetime import datetime

router = APIRouter()


def _zero_dashboard():
    return {
        "readinessScore": 0,
        "matchedJobs": 0,
        "skillsToImprove": 0,
        "learningProgress": 0,
        "extractedSkills": [],
        "skillRadarData": [],
        "jobMatches": [],
        "criticalSkillGaps": [],
        "courseRecommendations": [],
        "careerPath": {
            "currentRole": "",
            "targetRole": "",
            "readiness": 0,
            "estimatedTimeline": "",
            "intermediateSteps": [],
        },
    }

@router.get("/jobseeker-dashboard")
def seeker_dashboard(user: dict = Depends(require_role("jobseeker"))):
    user_ref = db.collection("users").document(user["email"])
    snap = user_ref.collection("dashboard").document("latest").get()
    if not snap.exists:
        return _zero_dashboard()
    data = snap.to_dict() or {}

    # Compute learning progress as an average of stored course progress.
    courses = []
    for s in user_ref.collection("learning_courses").stream():
        d = s.to_dict() or {}
        if isinstance(d.get("progress"), int):
            courses.append(int(d.get("progress")))
    avg_progress = round(sum(courses) / len(courses)) if courses else 0

    # Ensure required keys exist even if an older snapshot is stored.
    merged = {**_zero_dashboard(), **data}
    merged["learningProgress"] = avg_progress
    return merged

@router.get("/recruiter-dashboard")
def recruiter_dashboard(user: dict = Depends(require_role("recruiter"))):
    return {"message": "Welcome Recruiter", "user": user}
