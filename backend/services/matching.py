def calculate_match(user_skills, required_skills):
    user_set = set(user_skills)
    required_set = set(required_skills)

    matched = user_set.intersection(required_set)
    gap = required_set - user_set

    if len(required_set) == 0:
        score = 0
    else:
        score = (len(matched) / len(required_set)) * 100

    return {
        "match_score": round(score, 2),
        "matched_skills": list(matched),
        "skill_gap": list(gap)
    }
