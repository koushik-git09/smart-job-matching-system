from fastapi import APIRouter
from services.firebase import db

router = APIRouter()

@router.post("/add/{job_id}")
def add_job(job_id: str, job: dict):
    db.collection("jobs").document(job_id).set(job)
    return {"message": f"Job '{job_id}' added successfully"}
