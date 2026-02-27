from __future__ import annotations

from collections import Counter
from typing import Any

from services.semantic_matching import calculate_semantic_match
from services.catalog import list_courses_for_skill


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

    user_norm_list = [_norm_skill(s) for s in user_skills if _norm_skill(s)]
    req_norm_list = [_norm_skill(s) for s in req_names if _norm_skill(s)]

    norm_to_display: dict[str, str] = {}
    for display in req_names:
        n = _norm_skill(display)
        if n and n not in norm_to_display:
            norm_to_display[n] = display

    semantic = calculate_semantic_match(user_norm_list, req_norm_list)
    matched_norm = set([_norm_skill(s) for s in semantic.get("matched_skills", []) if _norm_skill(s)])
    gap_norm = set([_norm_skill(s) for s in semantic.get("skill_gap", []) if _norm_skill(s)])

    # Preserve ordering as in the job requirements.
    matched_display = [d for d in req_names if _norm_skill(d) in matched_norm]
    gap_display = [d for d in req_names if _norm_skill(d) in gap_norm]

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

    match_percentage = float(semantic.get("match_score", 0.0))
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

    # Radar data: dynamic axes derived from job requirements in Firestore (no in-code skill list).
    user_norm = {_norm_skill(s) for s in user_skills if _norm_skill(s)}
    radar = []
    req_counts = Counter()
    display_by_norm: dict[str, str] = {}
    for j in jobs:
        for rs in (j.get("required_skills") or j.get("requiredSkills") or []):
            display = _skill_name(rs)
            norm = _norm_skill(rs)
            if not norm:
                continue
            req_counts[norm] += 1
            if display and norm not in display_by_norm:
                display_by_norm[norm] = display

    axes_norm = [n for n, _ in req_counts.most_common(7)]
    max_req = max(req_counts.values()) if req_counts else 1
    for n in axes_norm:
        radar.append(
            {
                "skill": display_by_norm.get(n, n),
                "current": 100 if n in user_norm else 0,
                "required": round((req_counts.get(n, 0) / max_req) * 100),
            }
        )

    # Rank missing skills by frequency across job matches so recommendations differ per resume.
    freq = Counter()
    for m in job_matches:
        for g in m.get("missingSkills", []):
            if not isinstance(g, dict):
                continue
            if g.get("priority") != "critical":
                continue
            name = _skill_name(g.get("skillName"))
            if name:
                freq[name] += 1

    # Recommend up to 6 skills to keep the UI focused.
    top_missing = [name for name, _ in freq.most_common(6)]

    # Course recommendations: read from Firestore `courses` collection (no in-code URLs).
    courses: list[dict] = []
    for skill in top_missing:
        # Match on normalized skill.
        skill_norm = skill.strip().lower()
        for c in list_courses_for_skill(skill_norm, limit=3):
            courses.append(
                {
                    "id": str(c.get("id") or ""),
                    "title": c.get("title") or "",
                    "platform": c.get("platform") or "",
                    "duration": c.get("duration") or "",
                    "level": c.get("level") or "",
                    "readinessBoost": int(c.get("readinessBoost") or c.get("readiness_boost") or 0),
                    "url": c.get("url") or "",
                    "rating": float(c.get("rating") or 0),
                    "skillsCovered": c.get("skillsCovered") or c.get("skills_covered") or [],
                    "status": "recommended",
                    "progress": 0,
                }
            )

    # De-dup by course id.
    seen = set()
    deduped = []
    for c in courses:
        cid = str(c.get("id") or "")
        if not cid or cid in seen:
            continue
        seen.add(cid)
        deduped.append(c)
    courses = deduped[:10]

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
