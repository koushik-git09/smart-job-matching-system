from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from models.token import require_role
from services.dashboard_compute import compute_job_match
from services.firebase import db

router = APIRouter()


def _map_job_doc_to_frontend(job: dict) -> dict:
    required = job.get("required_skills") or job.get("requiredSkills") or []
    required_skills = []
    for rs in required:
        if not isinstance(rs, dict):
            continue
        required_skills.append(
            {
                "name": rs.get("name") or rs.get("skillName") or rs.get("skill") or "",
                "priority": rs.get("priority") or "must-have",
                "minimumExperience": rs.get("minimum_experience") or rs.get("minimumExperience") or 0,
            }
        )

    return {
        "id": str(job.get("id") or ""),
        "title": job.get("title") or "",
        "description": job.get("description") or "",
        "requiredSkills": required_skills,
        "experienceLevel": job.get("experience_level") or job.get("experienceLevel") or "",
        "location": job.get("location") or "",
        "salaryRange": job.get("salaryRange")
        or {
            "min": int(job.get("minSalary") or 0),
            "max": int(job.get("maxSalary") or 0),
        },
        "type": job.get("type") or "",
        "posted": job.get("posted")
        or (job.get("created_at").isoformat() if hasattr(job.get("created_at"), "isoformat") else ""),
    }


@router.get("/profile")
def get_profile(user: dict = Depends(require_role("recruiter"))):
    user_ref = db.collection("users").document(user["email"])
    user_doc = (user_ref.get().to_dict() or {}) if user_ref.get().exists else {}

    # Recruiter profile is stored on the user document for simplicity.
    company = user_doc.get("company") or ""
    company_description = user_doc.get("companyDescription") or user_doc.get("company_description") or ""
    industry = user_doc.get("industry") or ""

    job_postings = []
    for s in db.collection("jobs").where("created_by", "==", user["email"]).stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        job_postings.append(_map_job_doc_to_frontend(d))

    return {
        "userId": user["email"],
        "company": company,
        "companyDescription": company_description,
        "industry": industry,
        "jobPostings": job_postings,
    }


@router.put("/profile")
def upsert_profile(payload: dict, user: dict = Depends(require_role("recruiter"))):
    company = str(payload.get("company") or "").strip()
    company_description = str(payload.get("companyDescription") or "").strip()
    industry = str(payload.get("industry") or "").strip()

    if not company:
        raise HTTPException(status_code=400, detail="company is required")

    user_ref = db.collection("users").document(user["email"])
    user_ref.set(
        {
            "company": company,
            "companyDescription": company_description,
            "industry": industry,
            "updated_at": datetime.utcnow(),
        },
        merge=True,
    )

    return {"message": "Profile saved"}


@router.post("/job-postings")
def create_job_posting(payload: dict, user: dict = Depends(require_role("recruiter"))):
    job_id = str(payload.get("id") or "").strip() or uuid4().hex

    required_skills_in = payload.get("requiredSkills") or []
    required_skills = []
    for rs in required_skills_in:
        if not isinstance(rs, dict):
            continue
        name = str(rs.get("name") or "").strip()
        if not name:
            continue
        priority = str(rs.get("priority") or "must-have")
        try:
            min_exp = float(rs.get("minimumExperience") or 0)
        except Exception:
            min_exp = 0
        required_skills.append(
            {
                "name": name,
                "priority": priority if priority in ("must-have", "good-to-have") else "must-have",
                "minimum_experience": min_exp,
                "required_level": str(rs.get("requiredLevel") or ""),
                "estimated_learning_time": str(rs.get("estimatedLearningTime") or ""),
            }
        )

    doc = {
        "id": job_id,
        "title": payload.get("title") or "",
        "company": payload.get("company") or "",
        "description": payload.get("description") or "",
        "location": payload.get("location") or "",
        "type": payload.get("type") or "",
        "experience_level": payload.get("experienceLevel") or "",
        "salaryRange": payload.get("salaryRange") or {"min": 0, "max": 0},
        "required_skills": required_skills,
        "posted": payload.get("posted") or datetime.utcnow().date().isoformat(),
        "created_by": user["email"],
        "created_at": datetime.utcnow(),
    }

    db.collection("jobs").document(job_id).set(doc)
    return {"message": "Job created", "jobId": job_id}


@router.get("/job-postings")
def list_job_postings(user: dict = Depends(require_role("recruiter"))):
    jobs = []
    for s in db.collection("jobs").where("created_by", "==", user["email"]).stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(_map_job_doc_to_frontend(d))

    return {"jobs": jobs}


@router.get("/candidate-matches")
def candidate_matches(job_id: str | None = None, user: dict = Depends(require_role("recruiter"))):
    # Pick a job posting (explicit or first available).
    job_doc = None
    if job_id:
        snap = db.collection("jobs").document(job_id).get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        job_doc = snap.to_dict() or {}
        job_doc.setdefault("id", snap.id)
    else:
        snaps = list(db.collection("jobs").where("created_by", "==", user["email"]).stream())
        if not snaps:
            return {"matches": []}
        s0 = snaps[0]
        job_doc = s0.to_dict() or {}
        job_doc.setdefault("id", s0.id)

    matches = []

    # Stream all users and pick jobseekers with a stored resume.
    for u in db.collection("users").stream():
        ud = u.to_dict() or {}
        if ud.get("role") != "jobseeker":
            continue
        candidate_email = str(ud.get("email") or u.id)
        resume_snap = db.collection("users").document(candidate_email).collection("resume").document("latest").get()
        if not resume_snap.exists:
            continue
        resume_data = resume_snap.to_dict() or {}
        skills = resume_data.get("extracted_skills") or []
        if not isinstance(skills, list) or not skills:
            continue

        m = compute_job_match([str(x) for x in skills], job_doc)
        matches.append(
            {
                "candidateId": candidate_email,
                "candidateName": ud.get("name") or candidate_email,
                "jobId": m.get("jobId"),
                "jobTitle": m.get("jobTitle"),
                "matchPercentage": m.get("matchPercentage", 0),
                "readinessScore": m.get("readinessScore", 0),
                "strengthAreas": m.get("strengthAreas", []),
                "missingSkills": [g.get("skillName") for g in (m.get("missingSkills") or []) if isinstance(g, dict) and g.get("skillName")],
            }
        )

    matches.sort(key=lambda x: x.get("matchPercentage", 0), reverse=True)
    return {"matches": matches}
