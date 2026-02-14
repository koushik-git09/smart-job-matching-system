from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.resume_parser import extract_text_from_pdf, extract_skills
from services.firebase import db
from models.token import verify_token
from services.dashboard_compute import compute_dashboard
from services.job_catalog import default_jobs
import shutil
import os
from datetime import datetime

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(file_path)
    skills = extract_skills(text)

    os.remove(file_path)

    user_ref = db.collection("users").document(user["email"])

    # Store per user (subcollection structure)
    user_ref.collection("resume").document("latest").set(
        {
            "extracted_skills": skills,
            "uploaded_at": datetime.utcnow(),
        }
    )

    # Compute dashboard snapshot based on all jobs currently in DB
    jobs = []
    for s in db.collection("jobs").stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(d)

    # If jobs were never seeded, seed a default catalog so the portal works out-of-the-box.
    if not jobs:
        seeded = default_jobs()
        for job in seeded:
            db.collection("jobs").document(job.id).set(job.model_dump())
            jobs.append(job.model_dump())
    dashboard = compute_dashboard(skills, jobs)

    # Seed per-user learning progress docs for the recommended courses
    for c in dashboard.get("courseRecommendations", []) or []:
        if not isinstance(c, dict):
            continue
        course_id = str(c.get("id") or "").strip()
        if not course_id:
            continue
        course_ref = user_ref.collection("learning_courses").document(course_id)
        if course_ref.get().exists:
            continue
        course_ref.set(
            {
                "courseTitle": c.get("title") or "",
                "platform": c.get("platform") or "",
                "skillsImproved": c.get("skillsCovered") or [],
                "status": "not-started",
                "progress": 0,
                "startedDate": None,
                "completedDate": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )

    user_ref.collection("dashboard").document("latest").set(
        {
            **dashboard,
            "updated_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Resume processed successfully",
        "skills_extracted": skills,
        "dashboard": dashboard,
    }
