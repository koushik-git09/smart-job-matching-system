# Job Seeker Platform

This is a code bundle for Job Seeker Platform. The original project is available at https://www.figma.com/design/jVQ17AnuJRK1fKRkKCfMMd/Job-Seeker-Platform.

## Running the code

Run `cd frontend` to go to the frontend app.

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Backend (FastAPI)

From the repo root:

- Create a virtualenv and install deps:
  - `python -m venv .venv`
  - `./.venv/Scripts/Activate.ps1`
  - `pip install -r backend/requirements.txt`
- Start the API server:
  - `cd backend`
  - `uvicorn main:app --reload`

The frontend expects the backend at `http://127.0.0.1:8000` by default.

### Backend environment variables (CORS + Firebase)

For local dev, you can copy [backend/.env.example](backend/.env.example) to `backend/.env`.

For deployment (e.g., Render), set these as platform environment variables:

- `CORS_ALLOW_ORIGINS`: comma-separated allowed browser origins.
  - Example: `https://smart-job-matching-system.vercel.app,http://localhost:5173`
  - If this is missing/incorrect, the browser will show CORS errors and you won’t be able to read the backend response.
- `CORS_ALLOW_ORIGIN_REGEX` (optional): useful for Vercel preview URLs.
  - Example: `^https://.*\\.vercel\\.app$`
- Firebase / Firestore credentials (provide one):
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (raw JSON)
  - `FIREBASE_SERVICE_ACCOUNT_B64` (base64 JSON)
  - `GOOGLE_APPLICATION_CREDENTIALS` (path to JSON on disk)

### Recruiter “Contact” email

The recruiter Contact button calls `POST /recruiter/contact-candidate`, which sends email via SMTP.

- Copy [backend/.env.example](backend/.env.example) to `backend/.env` and fill in `EMAIL_USER`/`EMAIL_PASS`.
- If using Gmail, you typically need an app password (regular account password often fails).
- For dev-only (no real email), set `EMAIL_BACKEND=console` to log instead of sending.
