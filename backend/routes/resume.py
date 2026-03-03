from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.resume_parser import extract_text_from_pdf
from services.skill_extraction import extract_skills_advanced
from services.firebase import db
from models.token import verify_token
from services.dashboard_compute import compute_dashboard
from services.role_classifier import predict_role_from_skills
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
    extracted = extract_skills_advanced(text)
    skills = extracted.get("skills", [])
    skills_norm = extracted.get("skills_norm", [])
    role_pred = predict_role_from_skills(skills_norm)

    os.remove(file_path)

    user_ref = db.collection("users").document(user["email"])

    # Prefer explicit career goal/target role on the user profile, otherwise use resume prediction.
    user_profile_snap = user_ref.get()
    user_doc = (user_profile_snap.to_dict() or {}) if user_profile_snap.exists else {}
    target_role = (
        user_doc.get("targetRole")
        or user_doc.get("target_role")
        or (user_doc.get("careerGoals") or {}).get("shortTerm")
        or (user_doc.get("career_goals") or {}).get("shortTerm")
        or role_pred.get("predicted_role")
    )

    # Store per user (subcollection structure)
    user_ref.collection("resume").document("latest").set(
        {
            "extracted_skills": skills,
            "extracted_skills_norm": skills_norm,
            "predicted_role": role_pred.get("predicted_role"),
            "predicted_role_score": role_pred.get("score", 0),
            "uploaded_at": datetime.utcnow(),
        }
    )

    # Compute dashboard snapshot based on all jobs currently in DB
    jobs = []
    for s in db.collection("jobs").stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(d)

    dashboard = compute_dashboard(skills, jobs, target_role=str(target_role).strip() if target_role else None)

    # Seed per-user learning progress docs for the recommended courses (course metadata stays in `courses`).
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
                "courseId": course_id,
                "status": "not-started",
                "progress": 0,
                "startedDate": None,
                "completedDate": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )

    skills_fingerprint = "|".join(sorted({str(x).strip().lower() for x in skills if str(x).strip()}))

    user_ref.collection("dashboard").document("latest").set(
        {
            **dashboard,
            "predictedRole": role_pred.get("predicted_role"),
            "targetRoleUsed": str(target_role).strip() if target_role else "",
            "skillsFingerprint": skills_fingerprint,
            "updated_at": datetime.utcnow(),
        }
    )

    # Store a compact analysis snapshot for other endpoints.
    user_ref.collection("analysis").document("latest").set(
        {
            "extracted_skills": skills,
            "extracted_skills_norm": skills_norm,
            "predicted_role": role_pred.get("predicted_role"),
            "predicted_role_score": role_pred.get("score", 0),
            "updated_at": datetime.utcnow(),
        }
    )

    return {
        "message": "Resume processed successfully",
        "skills_extracted": skills,
        "predicted_role": role_pred.get("predicted_role"),
        "dashboard": dashboard,
    }
