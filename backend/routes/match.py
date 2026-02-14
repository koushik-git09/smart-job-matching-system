from fastapi import APIRouter, Depends
from services.firebase import db
from services.semantic_matching import calculate_semantic_match
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


@router.get("/job/{job_id}")
def match_job(job_id: str, user=Depends(get_current_user)):

    # Get user resume
    resume_doc = db.collection("users") \
        .document(user["email"]) \
        .collection("resume") \
        .document("latest") \
        .get()

    if not resume_doc.exists:
        return {"error": "Resume not uploaded"}

    user_skills = resume_doc.to_dict().get("extracted_skills", [])

    # Get job
    job_doc = db.collection("jobs").document(job_id).get()

    if not job_doc.exists:
        return {"error": "Job not found"}

    job_data = job_doc.to_dict()
    required_skills = job_data.get("required_skills", [])

    result = calculate_semantic_match(user_skills, required_skills)


    return result
