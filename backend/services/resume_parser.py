import pdfplumber
from services.skill_extraction import extract_skills_advanced


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    return text


def extract_skills(text: str) -> list[str]:
    # Backward-compatible wrapper used by existing routes/tests.
    return extract_skills_advanced(text).get("skills", [])
