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
    except Exception:
        # Deployments sometimes omit the full model package. Fall back to a blank
        # pipeline so core tokenization / PhraseMatcher still work.
        try:
            lang = "en"
            if isinstance(model, str) and model:
                # Best-effort: infer language code from model name.
                lang = model.split("_")[0] if "_" in model else model
            return spacy.blank(lang)
        except Exception as e:
            raise RuntimeError(
                f"SpaCy could not load model '{model}' and could not create a blank pipeline."
            ) from e


@lru_cache(maxsize=1)
def get_bert_ner_pipeline():
    if not _env_flag("ENABLE_BERT_NER", "0"):
        return None

    from transformers import pipeline

    model_name = os.getenv("BERT_NER_MODEL", "dslim/bert-base-NER")
    # grouped_entities=True returns merged spans.
    return pipeline("ner", model=model_name, grouped_entities=True)
