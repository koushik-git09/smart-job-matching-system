from __future__ import annotations

from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _max_similarity_tfidf(required_skills: List[str], user_skills: List[str]) -> List[float]:
    if not required_skills or not user_skills:
        return [0.0 for _ in required_skills]

    # Skill strings are short; TF-IDF works as a lightweight fallback.
    corpus = required_skills + user_skills
    vectorizer = TfidfVectorizer().fit(corpus)
    req_matrix = vectorizer.transform(required_skills)
    user_matrix = vectorizer.transform(user_skills)
    sims = cosine_similarity(req_matrix, user_matrix)  # (req, user)

    # Convert to a plain python list of max values per required skill.
    return [float(row.max()) if row.size else 0.0 for row in sims]


def calculate_semantic_match(user_skills: List[str], required_skills: List[str], threshold: float = 0.5):
    """Return a semantic match score between two skill lists.

    Uses TF-IDF cosine similarity (scikit-learn) to keep the backend lightweight.
    """

    matched: List[str] = []
    gap: List[str] = []

    if not required_skills:
        return {"match_score": 0, "matched_skills": matched, "skill_gap": gap}

    # Historically, TF-IDF similarity needed a lower cutoff than embedding cosine similarity.
    # Preserve the prior behavior where a default threshold of 0.5 was adjusted to 0.2 when
    # SentenceTransformers wasn't available.
    effective_threshold = 0.2 if threshold == 0.5 else threshold

    max_sims = _max_similarity_tfidf(required_skills, user_skills)
    for skill, max_sim in zip(required_skills, max_sims, strict=False):
        if max_sim >= effective_threshold:
            matched.append(skill)
        else:
            gap.append(skill)

    score = (len(matched) / len(required_skills)) * 100 if required_skills else 0

    return {
        "match_score": round(score, 2),
        "matched_skills": matched,
        "skill_gap": gap,
    }
