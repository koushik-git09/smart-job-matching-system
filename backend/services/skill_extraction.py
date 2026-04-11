from __future__ import annotations

from functools import lru_cache
from typing import Any

from services.catalog import cache
from services.nlp_models import get_bert_ner_pipeline, get_spacy_nlp


def _norm(s: Any) -> str:
    return str(s or "").strip().lower()


@lru_cache(maxsize=4)
def _get_skill_phrase_matcher(vocab_key: int, terms: tuple[str, ...]):
    # Build once per (spaCy vocab, skill terms set).
    nlp = get_spacy_nlp()
    from spacy.matcher import PhraseMatcher

    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(t) for t in terms if t]
    if patterns:
        matcher.add("SKILL", patterns)
    return matcher


def extract_skills_advanced(text: str) -> dict:
    """Extract skills using DB-driven phrase matching + optional BERT NER.

    Returns:
      {
        "skills": ["python", "react", ...]   # canonical display names from Firestore
        "skills_norm": ["python", "react", ...]
        "debug": {"phrase_matches": [...], "ner_hits": [...]}
      }

    NOTE: No skills list is stored in code; skills are read from Firestore `skills` collection.
    """

    skills_catalog = cache.get_skills()
    nlp = get_spacy_nlp()

    # Build matcher from DB skill terms + aliases.
    matcher = _get_skill_phrase_matcher(id(nlp.vocab), skills_catalog.all_skill_terms)

    doc = nlp(text)

    matched_terms: set[str] = set()
    for _, start, end in matcher(doc):
        span = doc[start:end]
        term = _norm(span.text)
        if term:
            matched_terms.add(term)

    ner_hits: set[str] = set()
    ner_pipe = get_bert_ner_pipeline()
    if ner_pipe is not None:
        try:
            entities = ner_pipe(text)
            for ent in entities or []:
                word = _norm(ent.get("word"))
                if word:
                    ner_hits.add(word)
        except Exception:
            # If model isn't downloaded / runtime error, proceed with phrase matches only.
            pass

    all_terms = matched_terms | ner_hits

    canonical_norms: set[str] = set()
    for t in all_terms:
        if t in skills_catalog.canonical_by_norm:
            canonical_norms.add(t)
            continue
        mapped = skills_catalog.aliases_to_canonical_norm.get(t)
        if mapped:
            canonical_norms.add(mapped)

    skills_norm = sorted(canonical_norms)
    skills_display = [skills_catalog.canonical_by_norm.get(n, n) for n in skills_norm]

    return {
        "skills": skills_display,
        "skills_norm": skills_norm,
        "debug": {
            "phrase_matches": sorted(matched_terms),
            "ner_hits": sorted(ner_hits),
        },
    }
