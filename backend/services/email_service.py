from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

def _load_env_fallback(env_path: Path) -> None:
    """Minimal .env loader used when python-dotenv isn't available.

    - Supports simple KEY=VALUE lines.
    - Ignores blank lines and comments (#...)
    - Does not override variables already present in the environment.
    """

    try:
        if not env_path.exists():
            return
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("\"").strip("'")
            if not key:
                continue
            if os.getenv(key) is None:
                os.environ[key] = value
    except Exception:
        # Never block app startup on dotenv parsing.
        return


# Optional: load local env vars for development.
backend_env = Path(__file__).resolve().parents[1] / ".env"
try:
    from dotenv import load_dotenv  # type: ignore

    if backend_env.exists():
        load_dotenv(dotenv_path=backend_env)
    else:
        load_dotenv()
except Exception:
    _load_env_fallback(backend_env)


class EmailSendError(RuntimeError):
    pass


def _env_first(*names: str) -> str:
    for n in names:
        v = os.getenv(n)
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""


def _env_bool(name: str, *, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    s = str(raw).strip().lower()
    if s in {"1", "true", "t", "yes", "y", "on"}:
        return True
    if s in {"0", "false", "f", "no", "n", "off"}:
        return False
    return default


def _smtp_host() -> str:
    return str(os.getenv("SMTP_HOST") or os.getenv("EMAIL_SMTP_HOST") or "smtp.gmail.com").strip()


def _smtp_port() -> int:
    raw = str(os.getenv("SMTP_PORT") or os.getenv("EMAIL_SMTP_PORT") or "587").strip()
    try:
        return int(raw)
    except ValueError:
        return 587


def _smtp_timeout() -> int:
    raw = str(os.getenv("SMTP_TIMEOUT") or os.getenv("EMAIL_SMTP_TIMEOUT") or "20").strip()
    try:
        return int(raw)
    except ValueError:
        return 20


def send_email(
    *,
    to_email: str,
    subject: str,
    body: str,
    from_email: str | None = None,
    reply_to: str | None = None,
) -> None:
    """Send a plaintext email via SMTP using env credentials.

    Required env vars:
      - EMAIL_USER
      - EMAIL_PASS

    Optional env vars:
      - SMTP_HOST / EMAIL_SMTP_HOST (default: smtp.gmail.com)
      - SMTP_PORT / EMAIL_SMTP_PORT (default: 587)
    """

    backend = str(os.getenv("EMAIL_BACKEND") or "smtp").strip().lower()

    # Accept a few common env var names so deployments are less finicky.
    email_user = _env_first("EMAIL_USER", "SMTP_USER", "SMTP_USERNAME", "EMAIL_USERNAME")
    email_pass = _env_first("EMAIL_PASS", "SMTP_PASS", "SMTP_PASSWORD", "EMAIL_PASSWORD")

    if backend in {"console", "log"}:
        recipient = str(to_email or "").strip()
        if not recipient:
            raise EmailSendError("Missing recipient email")
        print(f"[email_service] EMAIL_BACKEND={backend} to={recipient} subject={subject!r}")
        return

    if backend != "smtp":
        raise EmailSendError(
            "Unsupported EMAIL_BACKEND. Use 'smtp' (default) or 'console'."
        )

    if not email_user or not email_pass:
        raise EmailSendError(
            "Email service not configured. Set EMAIL_USER/EMAIL_PASS (or SMTP_USER/SMTP_PASS)."
        )

    default_from = _env_first("EMAIL_FROM", "SMTP_FROM")
    sender = str(from_email or default_from or email_user).strip()
    recipient = str(to_email or "").strip()
    if not recipient:
        raise EmailSendError("Missing recipient email")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    if reply_to and str(reply_to).strip():
        msg["Reply-To"] = str(reply_to).strip()
    msg.set_content(body)

    host = _smtp_host()
    port = _smtp_port()
    timeout = _smtp_timeout()

    # SMTP over SSL (implicit TLS) is commonly on port 465.
    use_ssl = _env_bool("SMTP_SSL", default=False) or _env_bool("SMTP_USE_SSL", default=False) or port == 465
    # STARTTLS is commonly on port 587.
    starttls = _env_bool("SMTP_STARTTLS", default=not use_ssl)

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=timeout) as smtp:
                smtp.ehlo()
                smtp.login(email_user, email_pass)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=timeout) as smtp:
                smtp.ehlo()
                if starttls:
                    smtp.starttls()
                    smtp.ehlo()
                smtp.login(email_user, email_pass)
                smtp.send_message(msg)
    except Exception as e:  # pragma: no cover
        raise EmailSendError(f"Failed to send email via SMTP: {e}") from e


def compose_interview_invitation(*, candidate_name: str, company_name: str) -> tuple[str, str]:
    company = str(company_name or "Company").strip() or "Company"
    name = str(candidate_name or "Candidate").strip() or "Candidate"

    subject = f"Interview Invitation — {company}"

    body = (
        f"Hello {name},\n\n"
        "Congratulations! You have been shortlisted for the interview.\n\n"
        "📍 Interview Location: To be announced\n"
        "📅 Date: To be announced\n"
        "⏰ Time: To be announced\n\n"
        "Our team will contact you with further details.\n\n"
        "Best regards,\n"
        "Recruitment Team\n"
    )

    return subject, body
