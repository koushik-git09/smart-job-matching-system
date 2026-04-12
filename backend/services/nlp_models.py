from __future__ import annotations

import os
from functools import lru_cache


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
    """Deprecated: previously returned a HuggingFace NER pipeline.

    This project has been refactored to remove heavy ML dependencies
    (transformers/torch). Keep the function for compatibility with existing
    call sites, but always disable BERT NER.
    """

    return None
