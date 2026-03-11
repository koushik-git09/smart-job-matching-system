from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from models.token import require_role
from services.dashboard_compute import compute_job_match
from services.match_scoring import score_job_fit
from services.firebase import db
from services.catalog import cache

router = APIRouter()


def _norm_text(x: object) -> str:
    return str(x or "").strip().lower()


def _tokenize_title(x: object) -> set[str]:
    s = _norm_text(x)
    if not s:
        return set()
    out: set[str] = set()
    cur: list[str] = []
    for ch in s:
        if ch.isalnum():
            cur.append(ch)
        else:
            if cur:
                out.add("".join(cur))
                cur = []
    if cur:
        out.add("".join(cur))
    return {t for t in out if t}


def _best_role_rule_for_title(job_title: str) -> dict | None:
    """Pick the closest role_rule for a job title (lightweight token overlap)."""

    title_norm = _norm_text(job_title)
    title_tokens = _tokenize_title(title_norm)
    if not title_tokens:
        return None

    best_rule: dict | None = None
    best_score = 0.0
    for r in cache.get_roles().rules:
        role_name = str(r.get("role") or r.get("display_name") or r.get("name") or "").strip()
        if not role_name:
            continue
        rn = _norm_text(role_name)
        rn_tokens = _tokenize_title(rn)
        if not rn_tokens:
            continue
        inter = len(title_tokens & rn_tokens)
        union = len(title_tokens | rn_tokens) or 1
        score = (inter / union) + (0.2 if title_norm and title_norm in rn else 0.0)
        if score > best_score:
            best_score = score
            best_rule = r

    # Require some overlap to avoid wild matches.
    return best_rule if best_score >= 0.15 else None


def _weighted_match_from_rule(user_skills_norm: list[str], rule: dict) -> tuple[int, list[str], list[str]]:
    """Return (score%, matched, missing) using must-have/good-to-have weighting."""

    user_set = {str(s).strip().lower() for s in (user_skills_norm or []) if str(s).strip()}
    must = rule.get("must_have_skills") or rule.get("mustHaveSkills") or []
    good = rule.get("good_to_have_skills") or rule.get("goodToHaveSkills") or []

    must_norm = [str(s).strip().lower() for s in (must if isinstance(must, list) else []) if str(s).strip()]
    good_norm = [str(s).strip().lower() for s in (good if isinstance(good, list) else []) if str(s).strip()]

    must_set = set(must_norm)
    good_set = set(good_norm)

    must_matched = sorted(must_set & user_set)
    good_matched = sorted(good_set & user_set)

    must_score = (len(must_matched) / (len(must_set) or 1)) * 100
    good_score = (len(good_matched) / (len(good_set) or 1)) * 100 if good_set else 0.0

    # Strong weight for must-have, medium for good-to-have.
    score = int(round((0.7 * must_score) + (0.3 * good_score)))

    missing = [s for s in must_norm if s and s not in user_set]
    # Add a small number of missing good-to-have skills for UX.
    missing_good = [s for s in good_norm if s and s not in user_set]
    missing = list(dict.fromkeys(missing + missing_good))

    matched = list(dict.fromkeys(must_matched + good_matched))
    return score, matched, missing


def _recruiter_job_refs(recruiter_email: str) -> list[tuple[str, dict]]:
    """Return (job_id, meta) tuples for recruiter-owned jobs.

    Ownership is tracked in: users/{recruiter_email}/job_postings/{job_id}
    to keep the canonical `jobs` collection schema compatible with existing seed data.

    Meta fields (new, optional): { status: active|closed|draft, created_at }
    """

    out: list[tuple[str, dict]] = []
    for s in db.collection("users").document(recruiter_email).collection("job_postings").stream():
        out.append((s.id, s.to_dict() or {}))
    return out


def _recruiter_job_ids(recruiter_email: str, *, status: str | None = None) -> list[str]:
    ids: list[str] = []
    for job_id, meta in _recruiter_job_refs(recruiter_email):
        st = str(meta.get("status") or "active")
        if status and st != status:
            continue
        ids.append(job_id)
    return ids


def _map_job_doc_to_frontend(job: dict) -> dict:
    required = job.get("required_skills") or job.get("requiredSkills") or []
    required_skills = []
    for rs in required:
        if isinstance(rs, dict):
            required_skills.append(
                {
                    "name": rs.get("name") or rs.get("skillName") or rs.get("skill") or "",
                    "priority": rs.get("priority") or "must-have",
                    "minimumExperience": rs.get("minimum_experience") or rs.get("minimumExperience") or 0,
                }
            )
            continue
        # Backward/alternate schema: list[str]
        name = str(rs or "").strip()
        if name:
            required_skills.append({"name": name, "priority": "must-have", "minimumExperience": 0})

    return {
        "id": str(job.get("id") or ""),
        "title": job.get("title") or "",
        "description": job.get("description") or "",
        "requiredSkills": required_skills,
        "experienceLevel": job.get("experience_level") or job.get("experienceLevel") or "",
        "location": job.get("location") or "",
        "salaryRange": job.get("salaryRange")
        or {
            "min": int(job.get("minSalary") or 0),
            "max": int(job.get("maxSalary") or 0),
        },
        "type": job.get("type") or "",
        "posted": job.get("posted")
        or (job.get("created_at").isoformat() if hasattr(job.get("created_at"), "isoformat") else ""),
    }


@router.get("/profile")
def get_profile(user: dict = Depends(require_role("recruiter"))):
    user_ref = db.collection("users").document(user["email"])
    user_doc = (user_ref.get().to_dict() or {}) if user_ref.get().exists else {}

    # Recruiter profile is stored on the user document for simplicity.
    company = user_doc.get("company") or ""
    company_description = user_doc.get("companyDescription") or user_doc.get("company_description") or ""
    industry = user_doc.get("industry") or ""

    job_postings = []
    for job_id in _recruiter_job_ids(user["email"], status="active"):
        snap = db.collection("jobs").document(job_id).get()
        if not snap.exists:
            continue
        d = snap.to_dict() or {}
        d.setdefault("id", snap.id)
        job_postings.append(_map_job_doc_to_frontend(d))

    return {
        "userId": user["email"],
        "company": company,
        "companyDescription": company_description,
        "industry": industry,
        "jobPostings": job_postings,
    }


@router.put("/profile")
def upsert_profile(payload: dict, user: dict = Depends(require_role("recruiter"))):
    company = str(payload.get("company") or "").strip()
    company_description = str(payload.get("companyDescription") or "").strip()
    industry = str(payload.get("industry") or "").strip()

    if not company:
        raise HTTPException(status_code=400, detail="company is required")

    user_ref = db.collection("users").document(user["email"])
    user_ref.set(
        {
            "company": company,
            "companyDescription": company_description,
            "industry": industry,
            "updated_at": datetime.utcnow(),
        },
        merge=True,
    )

    return {"message": "Profile saved"}


@router.post("/job-postings")
def create_job_posting(payload: dict, user: dict = Depends(require_role("recruiter"))):
    job_id = str(payload.get("id") or "").strip() or uuid4().hex

    # Firestore `jobs` collection baseline schema (see backend/database/jobs.json):
    # { title, company, required_skills: [str], external_apply_link, location, type, description }
    # We also keep recruiter attribution fields for filtering in recruiter views.

    required_skills_raw = payload.get("required_skills") or payload.get("requiredSkills") or []
    required_skills: list[str] = []
    for rs in required_skills_raw:
        if isinstance(rs, dict):
            name = rs.get("name") or rs.get("skillName") or rs.get("skill") or rs.get("title")
            name = str(name or "").strip()
        else:
            name = str(rs or "").strip()
        if name:
            required_skills.append(name)
    # De-dupe while preserving order.
    required_skills = list(dict.fromkeys(required_skills))

    title = str(payload.get("title") or "").strip()
    company = str(payload.get("company") or "").strip()
    location = str(payload.get("location") or "").strip()
    job_type = str(payload.get("type") or "").strip()
    description = str(payload.get("description") or "").strip()
    external_apply_link = str(payload.get("external_apply_link") or payload.get("externalApplyLink") or "").strip()

    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if not company:
        raise HTTPException(status_code=400, detail="company is required")
    if not required_skills:
        raise HTTPException(status_code=400, detail="required_skills must contain at least one skill")

    # IMPORTANT: Keep this schema aligned with the existing Firestore `jobs` dataset.
    doc = {
        "title": title,
        "company": company,
        "required_skills": required_skills,
        "external_apply_link": external_apply_link,
        "location": location,
        "type": job_type,
        "description": description,
        # Minimal recruiter attribution fields (safe for existing jobseeker queries).
        "recruiter_email": user["email"],
        "created_at": datetime.utcnow(),
        "status": "active",
    }

    db.collection("jobs").document(job_id).set(doc)

    # Track recruiter ownership outside of `jobs` to preserve the canonical schema.
    db.collection("users").document(user["email"]).collection("job_postings").document(job_id).set(
        {
            "job_id": job_id,
            "created_at": datetime.utcnow(),
            "status": "active",
        }
    )
    return {"message": "Job created", "jobId": job_id}


@router.get("/job-postings")
def list_job_postings(user: dict = Depends(require_role("recruiter"))):
    jobs = []
    for job_id in _recruiter_job_ids(user["email"], status="active"):
        snap = db.collection("jobs").document(job_id).get()
        if not snap.exists:
            continue
        d = snap.to_dict() or {}
        d.setdefault("id", snap.id)
        jobs.append(_map_job_doc_to_frontend(d))

    return {"jobs": jobs}


@router.get("/candidate-matches")
def candidate_matches(job_id: str | None = None, user: dict = Depends(require_role("recruiter"))):
    # Pick a job posting (explicit or first available).
    job_doc = None
    if job_id:
        snap = db.collection("jobs").document(job_id).get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        job_doc = snap.to_dict() or {}
        job_doc.setdefault("id", snap.id)
    else:
        ids = _recruiter_job_ids(user["email"])
        if not ids:
            return {"matches": []}
        s0 = db.collection("jobs").document(ids[0]).get()
        if not s0.exists:
            return {"matches": []}
        job_doc = s0.to_dict() or {}
        job_doc.setdefault("id", s0.id)

    matches = []

    # Stream all jobseekers with a stored resume.
    for u in db.collection("users").stream():
        ud = u.to_dict() or {}
        if ud.get("role") != "jobseeker":
            continue
        candidate_email = str(ud.get("email") or u.id)
        resume_snap = db.collection("users").document(candidate_email).collection("resume").document("latest").get()
        if not resume_snap.exists:
            continue
        resume_data = resume_snap.to_dict() or {}
        skills_norm = resume_data.get("extracted_skills_norm") or []
        skills = resume_data.get("extracted_skills") or []
        if not isinstance(skills_norm, list) or not skills_norm:
            # Backward compat.
            skills_norm = [str(x).strip().lower() for x in (skills or []) if str(x).strip()]

        if not isinstance(skills, list) or not skills:
            continue

        # Prefer role_rules-based weighting when a good rule match exists.
        rule = _best_role_rule_for_title(str(job_doc.get("title") or ""))
        if rule is not None:
            score, matched_norm, missing_norm = _weighted_match_from_rule(skills_norm, rule)
            # Provide display fields using the existing match envelope.
            m = compute_job_match([str(x) for x in skills], job_doc)
            m["matchPercentage"] = int(score)
            m["readinessScore"] = int(score)
            m["strengthAreas"] = matched_norm[:10]
            m["missingSkills"] = [
                {"skillName": s, "priority": "critical", "requiredLevel": "N/A", "estimatedLearningTime": "N/A", "currentLevel": None}
                for s in missing_norm[:12]
            ]
        else:
            # Fallback: exact overlap scoring (fast) + semantic gap lists.
            fit = score_job_fit([str(x) for x in skills_norm], job_doc.get("required_skills") or [])
            m = compute_job_match([str(x) for x in skills], job_doc)
            m["matchPercentage"] = int(fit.get("match_score") or 0)
            m["readinessScore"] = int(fit.get("match_score") or 0)

        matches.append(
            {
                "candidateId": candidate_email,
                "candidateName": ud.get("name") or candidate_email,
                "jobId": m.get("jobId"),
                "jobTitle": m.get("jobTitle"),
                "matchPercentage": m.get("matchPercentage", 0),
                "readinessScore": m.get("readinessScore", 0),
                "strengthAreas": m.get("strengthAreas", []),
                "missingSkills": [g.get("skillName") for g in (m.get("missingSkills") or []) if isinstance(g, dict) and g.get("skillName")],
            }
        )

    matches.sort(key=lambda x: x.get("matchPercentage", 0), reverse=True)
    return {"matches": matches}


@router.get("/dashboard")
def recruiter_dashboard(user: dict = Depends(require_role("recruiter"))):
    """Single payload for the recruiter dashboard.

    Returns:
      - profile: { company, industry }
      - activeJobs: [job]
      - metrics: { totalCandidates, highMatch, averageMatch, activeJobs }
      - candidates: [CandidateMatch], sorted
      - savedCandidateIds: [email]
    """

    # Recruiter profile basics.
    user_ref = db.collection("users").document(user["email"])
    snap = user_ref.get()
    ud = (snap.to_dict() or {}) if snap.exists else {}

    # Active jobs.
    job_ids = _recruiter_job_ids(user["email"], status="active")
    jobs: list[dict] = []
    for job_id in job_ids:
        js = db.collection("jobs").document(job_id).get()
        if not js.exists:
            continue
        d = js.to_dict() or {}
        d.setdefault("id", js.id)
        jobs.append(d)

    # Saved candidates.
    saved_ids: list[str] = []
    for s in user_ref.collection("saved_candidates").stream():
        saved_ids.append(s.id)

    # No jobs => return empty but consistent.
    if not jobs:
        return {
            "profile": {
                "email": user["email"],
                "company": ud.get("company") or "",
                "industry": ud.get("industry") or "",
            },
            "activeJobs": [],
            "metrics": {
                "totalCandidates": 0,
                "highMatch": 0,
                "averageMatch": 0,
                "activeJobs": 0,
            },
            "candidates": [],
            "savedCandidateIds": saved_ids,
        }

    # Stream candidates once, compute best job match per candidate.
    candidates: list[dict] = []
    for u in db.collection("users").stream():
        udoc = u.to_dict() or {}
        if udoc.get("role") != "jobseeker":
            continue

        candidate_email = str(udoc.get("email") or u.id)
        resume_snap = db.collection("users").document(candidate_email).collection("resume").document("latest").get()
        if not resume_snap.exists:
            continue
        resume = resume_snap.to_dict() or {}
        skills_norm = resume.get("extracted_skills_norm") or []
        skills = resume.get("extracted_skills") or []
        if not isinstance(skills_norm, list) or not skills_norm:
            skills_norm = [str(x).strip().lower() for x in (skills or []) if str(x).strip()]
        if not skills_norm:
            continue

        best: dict | None = None
        for j in jobs:
            # Prefer role_rules scoring; fallback to job.required_skills overlap.
            rule = _best_role_rule_for_title(str(j.get("title") or ""))
            if rule is not None:
                score, matched_norm, missing_norm = _weighted_match_from_rule(skills_norm, rule)
                m = compute_job_match([str(x) for x in (skills or [])], j)
                m["matchPercentage"] = int(score)
                m["readinessScore"] = int(score)
                m["strengthAreas"] = matched_norm[:10]
                m["missingSkills"] = [
                    {"skillName": s, "priority": "critical", "requiredLevel": "N/A", "estimatedLearningTime": "N/A", "currentLevel": None}
                    for s in missing_norm[:12]
                ]
            else:
                fit = score_job_fit([str(x) for x in skills_norm], j.get("required_skills") or [])
                m = compute_job_match([str(x) for x in (skills or [])], j)
                m["matchPercentage"] = int(fit.get("match_score") or 0)
                m["readinessScore"] = int(fit.get("match_score") or 0)

            packed = {
                "candidateId": candidate_email,
                "candidateName": udoc.get("name") or candidate_email,
                "jobId": m.get("jobId"),
                "jobTitle": m.get("jobTitle"),
                "matchPercentage": int(m.get("matchPercentage") or 0),
                "readinessScore": int(m.get("readinessScore") or 0),
                "strengthAreas": m.get("strengthAreas") or [],
                "missingSkills": [g.get("skillName") for g in (m.get("missingSkills") or []) if isinstance(g, dict) and g.get("skillName")],
                "saved": candidate_email in saved_ids,
            }

            if best is None or packed["matchPercentage"] > int(best.get("matchPercentage") or 0):
                best = packed

        if best is not None:
            candidates.append(best)

    candidates.sort(key=lambda x: x.get("matchPercentage", 0), reverse=True)

    total = len(candidates)
    high = len([c for c in candidates if int(c.get("matchPercentage") or 0) >= 80])
    avg = int(round(sum(int(c.get("matchPercentage") or 0) for c in candidates) / (total or 1)))

    active_jobs_frontend = []
    for j in jobs:
        active_jobs_frontend.append(_map_job_doc_to_frontend({**j, "id": j.get("id") or ""}))

    return {
        "profile": {
            "email": user["email"],
            "company": ud.get("company") or "",
            "industry": ud.get("industry") or "",
        },
        "activeJobs": active_jobs_frontend,
        "metrics": {
            "totalCandidates": total,
            "highMatch": high,
            "averageMatch": avg,
            "activeJobs": len(active_jobs_frontend),
        },
        "candidates": candidates,
        "savedCandidateIds": saved_ids,
    }


@router.post("/saved-candidates/{candidate_id}")
def toggle_saved_candidate(candidate_id: str, user: dict = Depends(require_role("recruiter"))):
    """Toggle saved/shortlisted candidate for this recruiter."""

    cid = str(candidate_id or "").strip().lower()
    if not cid:
        raise HTTPException(status_code=400, detail="candidate_id is required")

    ref = db.collection("users").document(user["email"]).collection("saved_candidates").document(cid)
    snap = ref.get()
    if snap.exists:
        ref.delete()
        return {"saved": False, "candidateId": cid}

    ref.set({"candidate_id": cid, "created_at": datetime.utcnow()})
    return {"saved": True, "candidateId": cid}


@router.get("/saved-candidates")
def list_saved_candidates(user: dict = Depends(require_role("recruiter"))):
    ids: list[str] = []
    for s in db.collection("users").document(user["email"]).collection("saved_candidates").stream():
        ids.append(s.id)
    return {"candidateIds": ids}


@router.get("/candidate-resume/{candidate_id}")
def get_candidate_resume(candidate_id: str, user: dict = Depends(require_role("recruiter"))):
    """Return a recruiter's view of a candidate's stored resume analysis (no PDF file)."""

    cid = str(candidate_id or "").strip().lower()
    if not cid:
        raise HTTPException(status_code=400, detail="candidate_id is required")

    resume_snap = db.collection("users").document(cid).collection("resume").document("latest").get()
    if not resume_snap.exists:
        raise HTTPException(status_code=404, detail="Resume not found")

    r = resume_snap.to_dict() or {}
    return {
        "candidateId": cid,
        "extracted_skills": r.get("extracted_skills") or [],
        "extracted_skills_norm": r.get("extracted_skills_norm") or [],
        "predicted_role": r.get("predicted_role") or "",
        "predicted_role_score": r.get("predicted_role_score") or 0,
        "uploaded_at": r.get("uploaded_at").isoformat() if hasattr(r.get("uploaded_at"), "isoformat") else r.get("uploaded_at") or "",
    }


@router.post("/job-postings/{job_id}/status")
def set_job_status(job_id: str, payload: dict, user: dict = Depends(require_role("recruiter"))):
    """Update recruiter job status (active|closed|draft)."""

    jid = str(job_id or "").strip()
    status = str(payload.get("status") or "").strip().lower()
    if not jid:
        raise HTTPException(status_code=400, detail="job_id is required")
    if status not in {"active", "closed", "draft"}:
        raise HTTPException(status_code=400, detail="status must be one of: active, closed, draft")

    # Ensure this job is owned by recruiter.
    owner_ref = db.collection("users").document(user["email"]).collection("job_postings").document(jid)
    if not owner_ref.get().exists:
        raise HTTPException(status_code=404, detail="Job not found")

    owner_ref.set({"status": status, "updated_at": datetime.utcnow()}, merge=True)
    # Mirror status onto the job doc to support global job listings filtering.
    db.collection("jobs").document(jid).set({"status": status, "updated_at": datetime.utcnow()}, merge=True)

    return {"jobId": jid, "status": status}
