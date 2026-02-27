from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from services.firebase import db


def _now_utc() -> datetime:
    return datetime.utcnow()


def _norm(s: Any) -> str:
    return str(s or "").strip().lower()


@dataclass
class SkillsCatalog:
    canonical_by_norm: dict[str, str]
    aliases_to_canonical_norm: dict[str, str]
    all_skill_terms: list[str]


@dataclass
class RolesCatalog:
    rules: list[dict]


@dataclass
class CoursesCatalog:
    courses: list[dict]


@dataclass
class JobsCatalog:
    jobs: list[dict]


class _CatalogCache:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl = timedelta(seconds=ttl_seconds)
        self._skills: tuple[datetime, SkillsCatalog] | None = None
        self._roles: tuple[datetime, RolesCatalog] | None = None

    def get_skills(self) -> SkillsCatalog:
        if self._skills and (_now_utc() - self._skills[0]) < self.ttl:
            return self._skills[1]

        canonical_by_norm: dict[str, str] = {}
        aliases_to_canonical_norm: dict[str, str] = {}
        terms: set[str] = set()

        for snap in db.collection("skills").stream():
            doc = snap.to_dict() or {}
            name = doc.get("name") or doc.get("display_name") or snap.id
            canonical_norm = _norm(doc.get("normalized") or name or snap.id)
            if not canonical_norm:
                continue

            canonical_by_norm[canonical_norm] = str(name).strip()
            terms.add(canonical_norm)

            aliases = doc.get("aliases") or []
            if isinstance(aliases, list):
                for a in aliases:
                    a_norm = _norm(a)
                    if not a_norm:
                        continue
                    aliases_to_canonical_norm[a_norm] = canonical_norm
                    terms.add(a_norm)

        catalog = SkillsCatalog(
            canonical_by_norm=canonical_by_norm,
            aliases_to_canonical_norm=aliases_to_canonical_norm,
            all_skill_terms=sorted(terms),
        )
        self._skills = (_now_utc(), catalog)
        return catalog

    def get_roles(self) -> RolesCatalog:
        if self._roles and (_now_utc() - self._roles[0]) < self.ttl:
            return self._roles[1]

        rules: list[dict] = []
        for snap in db.collection("role_rules").stream():
            d = snap.to_dict() or {}
            d.setdefault("id", snap.id)
            rules.append(d)

        catalog = RolesCatalog(rules=rules)
        self._roles = (_now_utc(), catalog)
        return catalog


cache = _CatalogCache()


def list_jobs() -> list[dict]:
    jobs: list[dict] = []
    for s in db.collection("jobs").stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        jobs.append(d)
    return jobs


def list_courses_for_skill(skill_norm: str, limit: int = 5) -> list[dict]:
    # Firestore supports array-contains for single value.
    # Expect courses documents to have `skills_covered_norm` (preferred) or `skillsCovered`.
    courses: list[dict] = []
    skill_norm = _norm(skill_norm)
    if not skill_norm:
        return courses

    query = db.collection("courses").where("skills_covered_norm", "array_contains", skill_norm).limit(limit)
    for s in query.stream():
        d = s.to_dict() or {}
        d.setdefault("id", s.id)
        courses.append(d)

    # Backward compat if you stored `skillsCovered` instead.
    if not courses:
        query2 = db.collection("courses").where("skillsCovered", "array_contains", skill_norm).limit(limit)
        for s in query2.stream():
            d = s.to_dict() or {}
            d.setdefault("id", s.id)
            courses.append(d)

    return courses
