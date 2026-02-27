from __future__ import annotations

from typing import Any

from services.catalog import cache


def _norm(x: Any) -> str:
    return str(x or "").strip().lower()


def predict_role_from_skills(skills_norm: list[str]) -> dict:
    """Rule-based role classification driven by Firestore `role_rules`.

    Each `role_rules` doc can be like:
      {
        "role": "ML Engineer",
        "must_have_skills": ["python", "tensorflow"],
        "good_to_have_skills": ["docker"],
        "min_must_have_match": 1
      }

    Output:
      {"predicted_role": "...", "score": 3, "matched": {...}}
    """

    skills_set = {s for s in (_norm(x) for x in skills_norm) if s}
    roles = cache.get_roles().rules

    best = {
        "predicted_role": None,
        "score": 0,
        "matched": {"must_have": [], "good_to_have": []},
    }

    for r in roles:
        role_name = str(r.get("role") or r.get("display_name") or r.get("name") or "").strip()
        if not role_name:
            continue

        must = r.get("must_have_skills") or r.get("mustHaveSkills") or []
        good = r.get("good_to_have_skills") or r.get("goodToHaveSkills") or []

        must_norm = [_norm(x) for x in must if _norm(x)] if isinstance(must, list) else []
        good_norm = [_norm(x) for x in good if _norm(x)] if isinstance(good, list) else []

        must_matched = [s for s in must_norm if s in skills_set]
        good_matched = [s for s in good_norm if s in skills_set]

        min_must = int(r.get("min_must_have_match") or r.get("minMustHaveMatch") or 0)
        if len(must_matched) < min_must:
            continue

        # Simple scoring: must-have counts more.
        score = (len(must_matched) * 2) + len(good_matched)

        if score > best["score"]:
            best = {
                "predicted_role": role_name,
                "score": score,
                "matched": {"must_have": must_matched, "good_to_have": good_matched},
            }

    return best
