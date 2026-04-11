from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import inspect
import logging
import tempfile
from typing import Any
from services.resume_parser import extract_text_from_pdf
from services.skill_extraction import extract_skills_advanced
from services.firebase import db
from models.token import verify_token
from services.dashboard_compute import compute_dashboard
from services.role_classifier import predict_role_from_skills
from services.catalog import list_jobs
import shutil
import os
from datetime import datetime

router = APIRouter()

logger = logging.getLogger(__name__)


async def _maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    filename = str(file.filename or "")
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    tmp_path: str | None = None
    try:
        # Use a unique temp file to avoid collisions across users/requests.
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp_path = tmp.name
            shutil.copyfileobj(file.file, tmp)

        try:
            text = extract_text_from_pdf(tmp_path)
        except Exception:
            logger.exception("Failed to extract text from PDF")
            raise HTTPException(status_code=400, detail="Could not read this PDF")

        try:
            extracted = extract_skills_advanced(text)
        except Exception:
            logger.exception("Skill extraction failed")
            raise HTTPException(status_code=500, detail="Resume processing failed")

        skills = extracted.get("skills", [])
        skills_norm = extracted.get("skills_norm", [])
        role_pred = predict_role_from_skills(skills_norm)

        try:
            user_ref = db.collection("users").document(user["email"])
        except Exception:
            logger.exception("Firestore client error")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        # Prefer explicit career goal/target role on the user profile, otherwise use resume prediction.
        try:
            user_profile_snap = await _maybe_await(user_ref.get())
        except Exception:
            logger.exception("Firestore error reading user profile")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        user_doc = (user_profile_snap.to_dict() or {}) if getattr(user_profile_snap, "exists", False) else {}
        target_role = (
            user_doc.get("targetRole")
            or user_doc.get("target_role")
            or (user_doc.get("careerGoals") or {}).get("shortTerm")
            or (user_doc.get("career_goals") or {}).get("shortTerm")
            or role_pred.get("predicted_role")
        )

        # Store per user (subcollection structure)
        try:
            await _maybe_await(
                user_ref.collection("resume").document("latest").set(
                    {
                        "extracted_skills": skills,
                        "extracted_skills_norm": skills_norm,
                        "predicted_role": role_pred.get("predicted_role"),
                        "predicted_role_score": role_pred.get("score", 0),
                        "uploaded_at": datetime.utcnow(),
                    }
                )
            )
        except Exception:
            logger.exception("Firestore error writing resume snapshot")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        # Compute dashboard snapshot based on jobs currently in DB.
        # Use cached list to avoid streaming Firestore on every upload.
        try:
            jobs = list_jobs()
        except Exception:
            logger.exception("Failed to load jobs catalog")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        dashboard = compute_dashboard(skills, jobs, target_role=str(target_role).strip() if target_role else None)

        # Seed per-user learning progress docs for the recommended courses (course metadata stays in `courses`).
        for c in dashboard.get("courseRecommendations", []) or []:
            if not isinstance(c, dict):
                continue
            course_id = str(c.get("id") or "").strip()
            if not course_id:
                continue
            course_ref = user_ref.collection("learning_courses").document(course_id)
            try:
                snap = await _maybe_await(course_ref.get())
                if getattr(snap, "exists", False):
                    continue
            except Exception:
                logger.exception("Firestore error reading learning course")
                raise HTTPException(status_code=503, detail="Resume service unavailable")
            try:
                await _maybe_await(
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
                )
            except Exception:
                logger.exception("Firestore error seeding learning course")
                raise HTTPException(status_code=503, detail="Resume service unavailable")

        skills_fingerprint = "|".join(sorted({str(x).strip().lower() for x in skills if str(x).strip()}))

        try:
            await _maybe_await(
                user_ref.collection("dashboard").document("latest").set(
                    {
                        **dashboard,
                        "predictedRole": role_pred.get("predicted_role"),
                        "targetRoleUsed": str(target_role).strip() if target_role else "",
                        "skillsFingerprint": skills_fingerprint,
                        "updated_at": datetime.utcnow(),
                    }
                )
            )
        except Exception:
            logger.exception("Firestore error writing dashboard snapshot")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        # Store a compact analysis snapshot for other endpoints.
        try:
            await _maybe_await(
                user_ref.collection("analysis").document("latest").set(
                    {
                        "extracted_skills": skills,
                        "extracted_skills_norm": skills_norm,
                        "predicted_role": role_pred.get("predicted_role"),
                        "predicted_role_score": role_pred.get("score", 0),
                        "updated_at": datetime.utcnow(),
                    }
                )
            )
        except Exception:
            logger.exception("Firestore error writing analysis snapshot")
            raise HTTPException(status_code=503, detail="Resume service unavailable")

        return {
            "message": "Resume processed successfully",
            "skills_extracted": skills,
            "predicted_role": role_pred.get("predicted_role"),
            "dashboard": dashboard,
        }
    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                # Best-effort cleanup
                pass
