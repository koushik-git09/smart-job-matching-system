from fastapi import APIRouter
from services.firebase import db
from services.job_catalog import default_jobs

router = APIRouter()

@router.post("/add/{job_id}")
def add_job(job_id: str, job: dict):
    db.collection("jobs").document(job_id).set(job)
    return {"message": f"Job '{job_id}' added successfully"}


@router.post("/seed-default")
def seed_default_jobs():
    jobs = default_jobs()
    for job in jobs:
        db.collection("jobs").document(job.id).set(job.model_dump())
    return {"message": f"Seeded {len(jobs)} jobs"}


@router.get("/list")
def list_jobs():
    snapshots = db.collection("jobs").stream()
    jobs: list[dict] = []
    for s in snapshots:
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(d)
    return {"jobs": jobs}
