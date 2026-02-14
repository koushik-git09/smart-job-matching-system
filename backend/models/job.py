from typing import Literal, Optional, List

from pydantic import BaseModel


JobSkillPriority = Literal["must-have", "good-to-have"]
SkillGapPriority = Literal["critical", "optional"]


class JobRequiredSkill(BaseModel):
    name: str
    priority: JobSkillPriority = "must-have"
    required_level: Optional[str] = None
    estimated_learning_time: Optional[str] = None


class Job(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    type: Optional[str] = None
    experience_level: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[JobRequiredSkill] = []
