from __future__ import annotations

from collections import Counter
from typing import Any


def _skill_name(x: Any) -> str:
    if isinstance(x, str):
        return x.strip()
    if isinstance(x, dict):
        for key in ("name", "skillName", "skill", "title"):
            if key in x and x.get(key):
                return str(x.get(key, "")).strip()
        return ""
    return str(x).strip()


def _norm_skill(x: Any) -> str:
    return _skill_name(x).strip().lower()


def compute_job_match(user_skills: list[str], job: dict) -> dict:
    job_id = str(job.get("id") or "")
    title = job.get("title") or ""
    company = job.get("company") or ""

    req_skill_objs = job.get("required_skills") or job.get("requiredSkills") or []
    req_names = [_skill_name(s) for s in req_skill_objs if _skill_name(s)]

    user_norm = {_norm_skill(s) for s in user_skills if _norm_skill(s)}
    req_norm_by_display: dict[str, str] = {display: _norm_skill(display) for display in req_names}

    matched_display = [d for d in req_names if req_norm_by_display.get(d) in user_norm]
    gap_display = [d for d in req_names if req_norm_by_display.get(d) not in user_norm]

    # Enrich missing skills with metadata from job.required_skills
    meta_by_norm: dict[str, dict] = {}
    for s in req_skill_objs:
        if not isinstance(s, dict):
            continue
        norm = _norm_skill(s)
        if not norm:
            continue
        meta_by_norm[norm] = s

    missing_skills = []
    for display in gap_display:
        meta = meta_by_norm.get(_norm_skill(display), {})
        pr = str(meta.get("priority", "must-have") or "must-have")
        missing_skills.append(
            {
                "skillName": display,
                "priority": "critical" if pr == "must-have" else "optional",
                "currentLevel": None,
                "requiredLevel": str(meta.get("required_level") or meta.get("requiredLevel") or "N/A"),
                "estimatedLearningTime": str(meta.get("estimated_learning_time") or meta.get("estimatedLearningTime") or "N/A"),
            }
        )

    strength_areas = list(matched_display)

    match_percentage = (len(matched_display) / len(req_names) * 100) if req_names else 0.0
    readiness_score = round(match_percentage)

    return {
        "jobId": job_id,
        "jobTitle": title,
        "company": company,
        "matchPercentage": round(match_percentage),
        "strengthAreas": strength_areas,
        "missingSkills": missing_skills,
        "weakSkills": [],
        "readinessScore": readiness_score,
    }


def compute_dashboard(user_skills: list[str], jobs: list[dict]) -> dict:
    job_matches = [compute_job_match(user_skills, j) for j in jobs]
    job_matches.sort(key=lambda m: m.get("matchPercentage", 0), reverse=True)

    top3 = job_matches[:3]
    readiness = round(sum(m.get("matchPercentage", 0) for m in top3) / 3) if top3 else 0

    missing = []
    for m in job_matches:
        for g in m.get("missingSkills", []):
            if isinstance(g, dict) and g.get("priority") == "critical":
                missing.append(g.get("skillName"))
    unique_critical = sorted(set([x for x in missing if x]))

    # Radar data: fixed axes used by the current UI.
    axes = [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "Data Analysis",
        "SQL",
        "TensorFlow",
        "Statistics",
    ]

    user_norm = {_norm_skill(s) for s in user_skills if _norm_skill(s)}
    radar = []
    req_counts = Counter()
    for j in jobs:
        for rs in (j.get("required_skills") or j.get("requiredSkills") or []):
            norm = _norm_skill(rs)
            if norm:
                req_counts[norm] += 1

    max_req = max(req_counts.values()) if req_counts else 1
    for a in axes:
        a_norm = a.strip().lower()
        radar.append(
            {
                "skill": a,
                "current": 100 if a_norm in user_norm else 0,
                "required": round((req_counts.get(a_norm, 0) / max_req) * 100),
            }
        )

    # Course recommendations: lightweight mapping from missing critical skills
    course_map = {
        "Deep Learning": {
            "title": "Deep Learning Specialization",
            "platform": "Coursera",
            "duration": "3 months",
            "level": "Intermediate",
            "readinessBoost": 15,
            "url": "https://coursera.org/specializations/deep-learning",
            "rating": 4.9,
            "skillsCovered": ["Deep Learning", "Neural Networks", "CNNs", "RNNs"],
        },
        "PyTorch": {
            "title": "PyTorch for Deep Learning",
            "platform": "Udemy",
            "duration": "2 months",
            "level": "Intermediate",
            "readinessBoost": 12,
            "url": "https://udemy.com/pytorch-deep-learning",
            "rating": 4.7,
            "skillsCovered": ["PyTorch", "Deep Learning", "Computer Vision"],
        },
        "MLOps": {
            "title": "MLOps Fundamentals",
            "platform": "Coursera",
            "duration": "2 months",
            "level": "Intermediate",
            "readinessBoost": 18,
            "url": "https://coursera.org/learn/mlops",
            "rating": 4.8,
            "skillsCovered": ["MLOps", "Docker", "CI/CD", "Model Deployment"],
        },
        "Docker": {
            "title": "Docker for Developers",
            "platform": "Udemy",
            "duration": "1 month",
            "level": "Beginner",
            "readinessBoost": 10,
            "url": "https://udemy.com/docker",
            "rating": 4.7,
            "skillsCovered": ["Docker", "Containers"],
        },
        "Kubernetes": {
            "title": "Kubernetes Fundamentals",
            "platform": "Coursera",
            "duration": "2 months",
            "level": "Beginner",
            "readinessBoost": 10,
            "url": "https://coursera.org/learn/kubernetes",
            "rating": 4.6,
            "skillsCovered": ["Kubernetes", "Container Orchestration"],
        },
        "Research Publications": {
            "title": "Writing & Publishing Research",
            "platform": "Coursera",
            "duration": "3 months",
            "level": "Advanced",
            "readinessBoost": 8,
            "url": "https://coursera.org",
            "rating": 4.5,
            "skillsCovered": ["Research", "Academic Writing"],
        },
    }

    courses = []
    for s in unique_critical:
        if s in course_map:
            c = course_map[s]
            courses.append(
                {
                    "id": s,
                    **c,
                    "status": "recommended",
                    "progress": 0,
                }
            )

    # Career path: show the same jobs ordered by readiness as steps.
    career_steps = []
    for m in job_matches:
        career_steps.append(
            {
                "role": m.get("jobTitle"),
                "readiness": m.get("matchPercentage", 0),
                "skillsNeeded": [g.get("skillName") for g in m.get("missingSkills", []) if g.get("priority") == "critical"],
                "recommendedAction": "Apply now - you are ready!" if m.get("matchPercentage", 0) >= 85 else "Complete 1-2 courses, then apply",
            }
        )

    # Basic career path header fields (frontend requires these keys)
    current_role = "Current Role"
    target_role = career_steps[0]["role"] if career_steps else "Target Role"

    return {
        "readinessScore": readiness,
        "matchedJobs": len(job_matches),
        "skillsToImprove": len(unique_critical),
        "learningProgress": len(courses),
        "extractedSkills": user_skills,
        "skillRadarData": radar,
        "jobMatches": job_matches,
        "criticalSkillGaps": unique_critical,
        "courseRecommendations": courses,
        "careerPath": {
            "currentRole": current_role,
            "targetRole": target_role,
            "readiness": readiness,
            "estimatedTimeline": "3-6 months",
            "intermediateSteps": career_steps,
        },
    }
