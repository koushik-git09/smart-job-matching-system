from fastapi import APIRouter, Depends
from models.token import require_role

router = APIRouter()

@router.get("/jobseeker-dashboard")
def seeker_dashboard(user: dict = Depends(require_role("jobseeker"))):
    return {"message": "Welcome Job Seeker", "user": user}

@router.get("/recruiter-dashboard")
def recruiter_dashboard(user: dict = Depends(require_role("recruiter"))):
    return {"message": "Welcome Recruiter", "user": user}
