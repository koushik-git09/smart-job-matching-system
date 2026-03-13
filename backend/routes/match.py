from fastapi import APIRouter, Depends

from models.token import verify_token
from services.firebase import db
from services.semantic_matching import calculate_semantic_match

router = APIRouter()


@router.get("/job/{job_id}")
def match_job(job_id: str, user: dict = Depends(verify_token)):

    # Get user resume
    resume_doc = db.collection("users") \
        .document(user["email"]) \
        .collection("resume") \
        .document("latest") \
        .get()

    if not resume_doc.exists:
        return {"error": "Resume not uploaded"}

    resume_data = resume_doc.to_dict() or {}
    user_skills = resume_data.get("extracted_skills_norm") or resume_data.get("extracted_skills") or []

    # Get job
    job_doc = db.collection("jobs").document(job_id).get()

    if not job_doc.exists:
        return {"error": "Job not found"}

    job_data = job_doc.to_dict()
    required_skills = job_data.get("required_skills") or job_data.get("requiredSkills") or []

    result = calculate_semantic_match(user_skills, required_skills)


    return result
