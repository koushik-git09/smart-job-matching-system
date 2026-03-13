from __future__ import annotations

import os
from datetime import datetime

from fastapi import APIRouter, Depends
from services.firebase import db

from models.token import verify_token
from services.match_scoring import score_job_fit

router = APIRouter()

@router.post("/add/{job_id}")
def add_job(job_id: str, job: dict):
    db.collection("jobs").document(job_id).set(job)
    return {"message": f"Job '{job_id}' added successfully"}


@router.get("/list")
def list_jobs():
    snapshots = db.collection("jobs").stream()
    jobs: list[dict] = []
    for s in snapshots:
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(d)
    return {"jobs": jobs}


@router.get("/recommended")
def recommended_jobs(user: dict = Depends(verify_token)):
    """Return recommended jobs for the logged-in jobseeker.

    - Reads JWT (Authorization header)
    - Fetches user's extracted skills from Firestore
    - Compares against each job's required skills
    - Returns only recommended jobs with match score + external_apply_link
    """

    min_score = int(os.getenv("RECOMMENDED_MIN_MATCH_SCORE", "30"))
    limit = int(os.getenv("RECOMMENDED_JOBS_LIMIT", "10"))

    user_ref = db.collection("users").document(user["email"])
    resume_snap = user_ref.collection("resume").document("latest").get()
    if not resume_snap.exists:
        return {"jobs": []}

    resume = resume_snap.to_dict() or {}
    skills_norm = resume.get("extracted_skills_norm") or []
    if not isinstance(skills_norm, list) or not skills_norm:
        # Backward compat if only display skills exist.
        skills = resume.get("extracted_skills") or []
        skills_norm = [str(s).strip().lower() for s in skills if str(s).strip()]

    # Stream jobs and compute match.
    results: list[dict] = []
    for snap in db.collection("jobs").stream():
        job = snap.to_dict() or {}
        job.setdefault("id", snap.id)

        # Respect optional recruiter job lifecycle fields.
        status = str(job.get("status") or "active").strip().lower()
        if status in {"closed", "draft"}:
            continue

        jd_skills = job.get("required_skills") or job.get("requiredSkills") or []
        scoring = score_job_fit([str(x).strip().lower() for x in skills_norm], jd_skills)
        score = int(scoring.get("match_score") or 0)
        if score < min_score:
            continue

        results.append(
            {
                "id": str(job.get("id") or ""),
                "title": job.get("title") or "",
                "company": job.get("company") or "",
                "location": job.get("location") or "",
                "type": job.get("type") or "",
                "required_skills": jd_skills,
                "match_score": score,
                "external_apply_link": job.get("external_apply_link") or job.get("externalApplyLink") or "",
            }
        )

    results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    results = results[:limit]

    # Store snapshot for audit / future views.
    user_ref.collection("job_recommendations").document("latest").set(
        {
            "jobs": results,
            "min_score": min_score,
            "updated_at": datetime.utcnow(),
        }
    )

    return {"jobs": results}
