from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from models.learning import CourseProgressUpsert
from models.token import require_role
from services.firebase import db

router = APIRouter()


@router.get("/courses")
def list_courses(user: dict = Depends(require_role("jobseeker"))):
    user_ref = db.collection("users").document(user["email"])
    snapshots = user_ref.collection("learning_courses").stream()

    courses: list[dict] = []
    for s in snapshots:
        d = s.to_dict() or {}
        d.setdefault("courseId", s.id)

        # Attach metadata from central catalog if available.
        course_doc = db.collection("courses").document(s.id).get()
        if course_doc.exists:
            cd = course_doc.to_dict() or {}
            d.setdefault("courseTitle", cd.get("title") or cd.get("courseTitle") or "")
            d.setdefault("platform", cd.get("platform") or "")
            d.setdefault("url", cd.get("url") or "")
            d.setdefault("duration", cd.get("duration") or "")
            d.setdefault("level", cd.get("level") or "")
            d.setdefault("rating", cd.get("rating") or 0)
            d.setdefault("skillsImproved", cd.get("skillsCovered") or cd.get("skills_covered") or [])

        courses.append(d)

    # Best-effort ordering (missing updated_at => last)
    courses.sort(key=lambda c: c.get("updated_at") or c.get("startedDate") or datetime.min, reverse=True)
    return {"courses": courses}


@router.put("/courses/{course_id}")
def upsert_course(course_id: str, payload: CourseProgressUpsert, user: dict = Depends(require_role("jobseeker"))):
    if not course_id:
        raise HTTPException(status_code=400, detail="course_id is required")

    now = datetime.utcnow()
    data = payload.model_dump()

    # Normalize progress based on status
    if data["status"] == "not-started":
        data["progress"] = 0
        data["startedDate"] = None
        data["completedDate"] = None
    elif data["status"] == "in-progress":
        if not data.get("startedDate"):
            data["startedDate"] = now
        data["completedDate"] = None
        # Keep existing progress unless it's 0
        if not data.get("progress"):
            data["progress"] = 10
    elif data["status"] == "completed":
        if not data.get("startedDate"):
            data["startedDate"] = now
        data["completedDate"] = data.get("completedDate") or now
        data["progress"] = 100

    user_ref = db.collection("users").document(user["email"])
    doc_ref = user_ref.collection("learning_courses").document(course_id)

    doc_ref.set({
        **data,
        "updated_at": now,
    }, merge=True)

    return {"message": "Course progress saved", "courseId": course_id}
