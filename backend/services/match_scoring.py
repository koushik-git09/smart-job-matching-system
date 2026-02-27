from __future__ import annotations

from typing import Any


def _norm(x: Any) -> str:
    return str(x or "").strip().lower()


def score_job_fit(resume_skills_norm: list[str], jd_skills: list[Any]) -> dict:
    """Compute match score = (Common Skills / JD Skills) * 100.

    Accepts JD skills as list[str] or list[dict] with name fields.
    Returns {
      "jd_skills_norm": [...],
      "common_skills_norm": [...],
      "match_score": int
    }
    """

    resume_set = {_norm(s) for s in resume_skills_norm if _norm(s)}

    jd_norm: list[str] = []
    for s in jd_skills or []:
        if isinstance(s, dict):
            name = s.get("name") or s.get("skillName") or s.get("skill") or s.get("title")
            sn = _norm(name)
        else:
            sn = _norm(s)
        if sn:
            jd_norm.append(sn)

    jd_unique = list(dict.fromkeys(jd_norm))
    jd_set = set(jd_unique)

    if not jd_unique:
        return {"jd_skills_norm": [], "common_skills_norm": [], "match_score": 0}

    common = sorted(jd_set & resume_set)
    score = int(round((len(common) / len(jd_unique)) * 100))

    return {
        "jd_skills_norm": jd_unique,
        "common_skills_norm": common,
        "match_score": score,
    }
