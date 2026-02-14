from fastapi import APIRouter, UploadFile, File, Depends
from services.resume_parser import extract_text_from_pdf, extract_skills
from services.firebase import db
from utils.auth import get_current_user  # if you created token verification

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):

    contents = await file.read()
    
    with open("temp_resume.pdf", "wb") as f:
        f.write(contents)

    text = extract_text_from_pdf("temp_resume.pdf")
    skills = extract_skills(text)

    db.collection("users").document(user["email"]).update({
        "extracted_skills": skills
    })

    return {
        "message": "Resume processed successfully",
        "skills": skills
    }
