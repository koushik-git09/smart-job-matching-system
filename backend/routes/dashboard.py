from fastapi import APIRouter, Depends
from models.token import require_role
from services.firebase import db
from services.dashboard_compute import compute_dashboard
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

    data = (snap.to_dict() or {}) if snap.exists else {}

    # If the snapshot is missing or incomplete, but a resume exists, recompute.
    needs_recompute = (not snap.exists) or (not data.get("jobMatches")) or (not data.get("skillRadarData"))
    if needs_recompute:
        resume_snap = user_ref.collection("resume").document("latest").get()
        if resume_snap.exists:
            resume_data = resume_snap.to_dict() or {}
            skills = resume_data.get("extracted_skills") or []
            if isinstance(skills, list) and skills:
                jobs: list[dict] = []
                for s in db.collection("jobs").stream():
                    d = s.to_dict() or {}
                    d.setdefault("id", s.id)
                    jobs.append(d)

                computed = compute_dashboard([str(x) for x in skills], jobs)
                computed["updated_at"] = datetime.utcnow()
                user_ref.collection("dashboard").document("latest").set(computed)
                data = computed

    # Ensure required keys exist even if an older snapshot is stored.
    return {**_zero_dashboard(), **(data or {})}

@router.get("/recruiter-dashboard")
def recruiter_dashboard(user: dict = Depends(require_role("recruiter"))):
    return {"message": "Welcome Recruiter", "user": user}
