from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.resume_parser import extract_text_from_pdf, extract_skills
from services.firebase import db
from jose import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import shutil
import os
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(file_path)
    skills = extract_skills(text)

    os.remove(file_path)

    # Store per user (subcollection structure)
    db.collection("users") \
        .document(user["email"]) \
        .collection("resume") \
        .document("latest") \
        .set({
            "extracted_skills": skills,
            "uploaded_at": datetime.utcnow(),
            "readiness_score": 0,
            "skill_gap": []
        })

    return {
        "message": "Resume processed successfully",
        "skills_extracted": skills
    }
