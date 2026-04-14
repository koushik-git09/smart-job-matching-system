import os
import importlib
from typing import Final


_DEFAULT_MODEL: Final[str] = "gemini-1.5-flash"


def _require_api_key() -> str:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    return api_key


def get_resume_suggestions(resume_text: str, query: str) -> str:
    """Return Gemini-generated resume suggestions and career advice.

    Reads GEMINI_API_KEY from environment. Raises RuntimeError if missing.
    """

    api_key = _require_api_key()

    try:
        genai = importlib.import_module("google.genai")
    except Exception as exc:
        raise RuntimeError(
            "google-genai is not installed; install dependencies from backend/requirements.txt"
        ) from exc

    model_name = (os.getenv("GEMINI_MODEL") or _DEFAULT_MODEL).strip() or _DEFAULT_MODEL
    client = genai.Client(api_key=api_key)

    resume_text = (resume_text or "").strip()
    query = (query or "").strip()

    prompt = (
        "You are a career coach and resume reviewer. "
        "Given the candidate context and the user's question, provide actionable, concise advice. "
        "Prefer bullet points and concrete examples.\n\n"
        f"CANDIDATE CONTEXT (may be partial):\n{resume_text}\n\n"
        f"USER QUESTION:\n{query}\n\n"
        "Return: (1) Resume suggestions (2) Career advice (3) Next steps."
    )

    result = client.models.generate_content(model=model_name, contents=prompt)
    text = getattr(result, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    return str(result)
