from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from models.token import require_role
from services.firebase import db
from services.dashboard_compute import compute_dashboard, compute_job_match
from services.pdf_report import generate_candidate_resume_report_pdf
from datetime import datetime
from typing import Any
from io import BytesIO

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


@router.get("/candidate/resume-pdf/{candidate_id}")
def candidate_resume_pdf(candidate_id: str, user: dict = Depends(require_role("recruiter"))):
    cid = str(candidate_id or "").strip().lower()
    if not cid:
        raise HTTPException(status_code=400, detail="candidate_id is required")

    # Candidate identity & stored data.
    candidate_snap: Any = db.collection("users").document(cid).get()
    if not candidate_snap.exists:
        raise HTTPException(status_code=404, detail="Candidate not found")
    candidate_doc = candidate_snap.to_dict() or {}

    name = str(candidate_doc.get("name") or candidate_doc.get("fullName") or cid).strip()
    email = str(candidate_doc.get("email") or cid).strip()

    resume_snap = db.collection("users").document(cid).collection("resume").document("latest").get()
    resume = (resume_snap.to_dict() or {}) if resume_snap.exists else {}

    skills = resume.get("extracted_skills") or []
    if not isinstance(skills, list):
        skills = []
    skills = [str(s).strip() for s in skills if str(s).strip()]

    experience = (
        resume.get("experience")
        or resume.get("work_experience")
        or candidate_doc.get("experience")
        or candidate_doc.get("workExperience")
    )
    education = (
        resume.get("education")
        or candidate_doc.get("education")
        or candidate_doc.get("educations")
    )

    # Match/readiness score: compute against recruiter's first active job (if any).
    match_score = None
    readiness_score = None
    try:
        job_postings_ref = db.collection("users").document(user["email"]).collection("job_postings")
        job_ids: list[str] = []
        for s in job_postings_ref.stream():
            meta = s.to_dict() or {}
            status = str(meta.get("status") or "active").strip().lower()
            if status != "active":
                continue
            job_ids.append(s.id)

        # Fallback: take any job posting doc if none active.
        if not job_ids:
            for s in job_postings_ref.stream():
                job_ids.append(s.id)
                break

        if job_ids:
            jsnap: Any = db.collection("jobs").document(job_ids[0]).get()
            if jsnap.exists:
                job_doc = jsnap.to_dict() or {}
                job_doc.setdefault("id", jsnap.id)
                m = compute_job_match(skills, job_doc)
                match_score = int(m.get("matchPercentage") or 0)
                readiness_score = int(m.get("readinessScore") or match_score)
    except Exception:
        # Scores are optional in the report; don't fail PDF generation.
        pass

    pdf_bytes = generate_candidate_resume_report_pdf(
        name=name,
        email=email,
        skills=skills,
        experience=experience,
        education=education,
        match_score=match_score,
        readiness_score=readiness_score,
    )

    filename = f"candidate-{cid}-resume-report.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
