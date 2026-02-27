from __future__ import annotations

import os
from functools import lru_cache


def _env_flag(name: str, default: str = "0") -> bool:
    return str(os.getenv(name, default)).strip().lower() in {"1", "true", "yes", "y", "on"}


@lru_cache(maxsize=1)
def get_spacy_nlp():
    import spacy

    model = os.getenv("SPACY_MODEL", "en_core_web_sm")
    try:
        return spacy.load(model)
    except Exception as e:
        raise RuntimeError(
            f"SpaCy model '{model}' is not available. "
            f"Install it with: python -m spacy download {model}"
        ) from e


@lru_cache(maxsize=1)
def get_bert_ner_pipeline():
    if not _env_flag("ENABLE_BERT_NER", "0"):
        return None

    from transformers import pipeline

    model_name = os.getenv("BERT_NER_MODEL", "dslim/bert-base-NER")
    # grouped_entities=True returns merged spans.
    return pipeline("ner", model=model_name, grouped_entities=True)
