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

### Recruiter “Contact” email

The recruiter Contact button calls `POST /recruiter/contact-candidate`, which sends email via SMTP.

- Copy [backend/.env.example](backend/.env.example) to `backend/.env` and fill in `EMAIL_USER`/`EMAIL_PASS`.
- If using Gmail, you typically need an app password (regular account password often fails).
- For dev-only (no real email), set `EMAIL_BACKEND=console` to log instead of sending.
