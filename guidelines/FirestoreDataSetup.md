# Firestore Data Setup (Step-by-step)

This project is now **DB-driven** for skills, roles, jobs, and courses.
Nothing like skills/job lists/course URLs is stored in frontend/backend code.

## 0) Prerequisites

1. Create/choose a Firebase project.
2. Enable **Cloud Firestore** (Native mode).
3. Ensure backend service-account key exists at:
   - `backend/firebase-key.json`
4. Start backend (from `backend/`):
   - `uvicorn main:app --reload`

## 1) Create collections

Create these Firestore collections:

- `skills`
- `role_rules`
- `jobs`
- `courses`
- `users` (created automatically by signup/login flow; you can also pre-create)

### 1.1 `skills` collection (required)

Document ID: **normalized skill name** (recommended).

Fields (recommended):
- `name` (string) – display name (e.g., "Python")
- `normalized` (string) – lowercase canonical (e.g., "python")
- `aliases` (array of strings) – synonyms (e.g., ["py", "python3"])
- `category` (string) – optional

Why: resume extraction uses **phrase matching** against these terms + aliases.

#### Check (Skills)
1. Add at least 30–50 skill docs.
2. Upload a resume PDF.
3. Confirm response includes `skills_extracted`.

Backend endpoint:
- `POST /resume/upload` (Bearer token required)

## 2) `role_rules` collection (required for role prediction)

Document ID: any (recommended: normalized role name).

Fields:
- `role` (string) – output label (e.g., "Frontend Developer")
- `must_have_skills` (array of strings, normalized)
- `good_to_have_skills` (array of strings, normalized)
- `min_must_have_match` (number) – optional

Rule logic (current):
- Score = `2 * must_have_matches + good_to_have_matches`
- Highest score wins

#### Check (Role prediction)
1. Add role rules (Frontend/Backend/Data Scientist/ML Engineer, etc.).
2. Upload resume again.
3. Confirm `predicted_role` is returned by `POST /resume/upload`.

## 3) `jobs` collection (required for recommendations)

Document ID: any.

Fields (minimum):
- `title` (string)
- `company` (string)
- `required_skills` (array) – either array of strings OR array of objects with `name`
- `external_apply_link` (string) – external URL (LinkedIn / careers page)

Optional:
- `location` (string)
- `type` (string)
- `description` (string)

#### Check (Recommended jobs + Apply link)
1. Add 20–100 jobs with `required_skills` and `external_apply_link`.
2. Upload resume.
3. Call:
   - `GET /jobs/recommended` (Bearer token required)
4. Confirm response returns:
   - job `title`, `company`, `required_skills`
   - `match_score`
   - `external_apply_link` (only in this recommended endpoint)

Frontend check:
- Go to Job Seeker Dashboard → **Job Recommendations** tab → click **Apply Now**.

## 4) `courses` collection (required for course recommendations)

Document ID: any.

Fields:
- `title` (string)
- `platform` (string)
- `url` (string)
- `duration` (string)
- `level` (string)
- `rating` (number)
- `skills_covered_norm` (array of strings, normalized)  ← IMPORTANT

(Backward compat is supported if you used `skillsCovered`, but prefer `skills_covered_norm`.)

#### Check (Course recommendations)
1. Add courses mapped to common missing skills.
2. Upload resume.
3. Confirm dashboard response includes `courseRecommendations` with `url`.

## 5) How resume analysis is stored

After upload, backend writes:
- `users/{email}/resume/latest`
  - `extracted_skills`
  - `extracted_skills_norm`
  - `predicted_role`
- `users/{email}/dashboard/latest`
  - computed dashboard snapshot (skill gaps, radar, matches, course recommendations)
- `users/{email}/job_recommendations/latest`
  - last recommended jobs returned by `/jobs/recommended`

## 6) NLP configuration (SpaCy + optional BERT)

Backend uses:
- SpaCy phrase matcher (always)
- Optional BERT NER (enabled by env var)

Install deps:
- `pip install -r requirements.txt`
- `python -m spacy download en_core_web_sm`

Enable BERT NER (optional):
- set `ENABLE_BERT_NER=1`
- optional: set `BERT_NER_MODEL` (default is `dslim/bert-base-NER`)

## 7) Quick API smoke tests (Postman / curl)

1. Signup: `POST /auth/signup`
2. Login: `POST /auth/login` → copy `access_token`
3. Upload resume: `POST /resume/upload` with `Authorization: Bearer <token>`
4. Recommended jobs: `GET /jobs/recommended` with `Authorization: Bearer <token>`

If `/jobs/recommended` returns empty:
- ensure resume exists in `users/{email}/resume/latest`
- ensure jobs exist in `jobs` collection
- ensure `required_skills` are populated
