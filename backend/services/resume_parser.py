import pdfplumber
import spacy
import re

nlp = spacy.load("en_core_web_sm")

# Expanded skill database
SKILLS_DB = [
    # Programming
    "python", "java", "c++", "javascript", "typescript",

    # Web Development
    "frontend developer", "backend developer",
    "full stack developer", "react", "angular",
    "nodejs", "express", "django", "flask",

    # Data & AI
    "data analyst", "data scientist",
    "machine learning engineer", "ml engineer",
    "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn",

    # Cloud & DevOps
    "aws", "azure", "gcp",
    "docker", "kubernetes", "devops engineer",
    "cloud engineer",

    # Database
    "sql", "mongodb", "postgresql",

    # Tools
    "git", "power bi", "tableau"
]


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    return text.lower()


def extract_skills(text: str):
    found_skills = set()

    # Exact phrase matching
    for skill in SKILLS_DB:
        pattern = rf"\b{re.escape(skill)}\b"
        if re.search(pattern, text):
            found_skills.add(skill)

    return list(found_skills)
