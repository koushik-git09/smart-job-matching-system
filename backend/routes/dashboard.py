from fastapi import APIRouter, Depends
from models.token import require_role
from services.firebase import db
from services.dashboard_compute import compute_dashboard
from datetime import datetime
from typing import Any

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

    user_profile_snap: Any = user_ref.get()
    user_doc = (user_profile_snap.to_dict() or {}) if user_profile_snap.exists else {}
    resume_snap = user_ref.collection("resume").document("latest").get()
    resume_data = (resume_snap.to_dict() or {}) if resume_snap.exists else {}

    skills = resume_data.get("extracted_skills") or []
    if not isinstance(skills, list):
        skills = []

    # Prefer explicit user profile target role, fall back to resume-predicted role.
    target_role = (
        user_doc.get("targetRole")
        or user_doc.get("target_role")
        or (user_doc.get("careerGoals") or {}).get("shortTerm")
        or (user_doc.get("career_goals") or {}).get("shortTerm")
        or resume_data.get("predicted_role")
        or resume_data.get("predictedRole")
    )

    # Recompute when snapshot is missing/incomplete OR when inputs changed.
    stored_fingerprint = str(data.get("skillsFingerprint") or "")
    current_fingerprint = "|".join(sorted({str(x).strip().lower() for x in skills if str(x).strip()}))
    stored_target = str(data.get("targetRoleUsed") or "").strip().lower()
    current_target = str(target_role or "").strip().lower()

    # Ensure the dashboard reflects changes to the shared `jobs` collection.
    # We avoid reading full job documents unless we actually need to recompute.
    stored_jobs_count = int(data.get("jobsCountUsed") or 0)
    current_jobs_count = 0
    for _ in db.collection("jobs").select([]).stream():
        current_jobs_count += 1

    needs_recompute = (
        (not snap.exists)
        or (not data.get("jobMatches"))
        or (not data.get("skillRadarData"))
        or (stored_fingerprint != current_fingerprint)
        or (stored_target != current_target)
        or (stored_jobs_count != current_jobs_count)
    )

    if needs_recompute and (skills or target_role):
        jobs: list[dict] = []
        for s in db.collection("jobs").stream():
            d = s.to_dict() or {}
            d.setdefault("id", s.id)
            jobs.append(d)

        computed = compute_dashboard([str(x) for x in skills], jobs, target_role=str(target_role).strip() if target_role else None)
        computed["targetRoleUsed"] = str(target_role).strip() if target_role else ""
        computed["skillsFingerprint"] = current_fingerprint
        computed["jobsCountUsed"] = current_jobs_count
        computed["updated_at"] = datetime.utcnow()
        user_ref.collection("dashboard").document("latest").set(computed)
        data = computed

    # Ensure required keys exist even if an older snapshot is stored.
    return {**_zero_dashboard(), **(data or {})}

@router.get("/recruiter-dashboard")
def recruiter_dashboard(user: dict = Depends(require_role("recruiter"))):
    return {"message": "Welcome Recruiter", "user": user}
