from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load model once
model = SentenceTransformer("all-MiniLM-L6-v2")


def calculate_semantic_match(user_skills, required_skills, threshold=0.5):
    matched = []
    gap = []

    # Convert to embeddings
    user_embeddings = model.encode(user_skills)
    required_embeddings = model.encode(required_skills)

    for i, req_embed in enumerate(required_embeddings):
        similarities = cosine_similarity(
            [req_embed], user_embeddings
        )[0]

        max_sim = np.max(similarities)

        if max_sim >= threshold:
            matched.append(required_skills[i])
        else:
            gap.append(required_skills[i])

    if len(required_skills) == 0:
        score = 0
    else:
        score = (len(matched) / len(required_skills)) * 100

    return {
        "match_score": round(score, 2),
        "matched_skills": matched,
        "skill_gap": gap
    }
