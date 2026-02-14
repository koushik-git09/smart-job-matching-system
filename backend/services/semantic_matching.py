from __future__ import annotations

from functools import lru_cache
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from sentence_transformers import SentenceTransformer  # type: ignore

    _HAS_SENTENCE_TRANSFORMERS = True
except Exception:
    SentenceTransformer = None
    _HAS_SENTENCE_TRANSFORMERS = False


@lru_cache(maxsize=1)
def _get_st_model():
    if not _HAS_SENTENCE_TRANSFORMERS or SentenceTransformer is None:
        return None
    # Lazy-load so the backend can run without torch.
    return SentenceTransformer("all-MiniLM-L6-v2")


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

    Uses SentenceTransformers if available; falls back to TF-IDF cosine similarity
    so the backend can run without heavy ML dependencies.
    """

    matched: List[str] = []
    gap: List[str] = []

    if not required_skills:
        return {"match_score": 0, "matched_skills": matched, "skill_gap": gap}

    # If caller uses the default ST threshold, make the fallback usable.
    effective_threshold = 0.2 if (not _HAS_SENTENCE_TRANSFORMERS and threshold == 0.5) else threshold

    model = _get_st_model()
    if model is not None:
        # SentenceTransformers path
        required_embeddings = model.encode(required_skills)
        user_embeddings = model.encode(user_skills) if user_skills else []

        for i, req_embed in enumerate(required_embeddings):
            if len(user_embeddings) == 0:
                gap.append(required_skills[i])
                continue

            similarities = cosine_similarity([req_embed], user_embeddings)[0]
            max_sim = float(similarities.max()) if similarities.size else 0.0

            if max_sim >= effective_threshold:
                matched.append(required_skills[i])
            else:
                gap.append(required_skills[i])
    else:
        # Lightweight fallback
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
