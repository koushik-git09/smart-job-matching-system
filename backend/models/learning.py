from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


CourseStatus = Literal["not-started", "in-progress", "completed"]


class CourseProgressUpsert(BaseModel):
    courseTitle: str
    platform: str
    skillsImproved: list[str] = Field(default_factory=list)

    status: CourseStatus = "not-started"
    progress: int = 0

    startedDate: Optional[datetime] = None
    completedDate: Optional[datetime] = None
