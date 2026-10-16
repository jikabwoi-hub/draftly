"""Text embeddings via Google Gemini, with a deterministic offline fallback.

The product is designed to *degrade gracefully* when no AI provider is
configured (see ``docs/ENVIRONMENT.md``): you can still upload documents, ingest
them, and generate proposals without any API keys. To honour that promise this
module never touches the Google SDK unless ``GOOGLE_AI_API_KEY`` is actually set
\u2014 otherwise the SDK falls back to Application Default Credentials, which hangs
for ~60s trying to reach the GCP metadata server and then raises.

When no key is present we return a deterministic hashing-based embedding. It
carries no semantic meaning, but it keeps the pgvector pipeline functional and
the vectors the correct shape. Add a real key to get true semantic retrieval.
"""

import hashlib
import logging
import math
import re

import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

_configured = False
_warned_offline = False


def _has_api_key() -> bool:
    return bool((getattr(settings, "GOOGLE_AI_API_KEY", "") or "").strip())


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        _configured = True


def _offline_embedding(text: str) -> list[float]:
    """Deterministic, dependency-free embedding used when no API key is set."""
    global _warned_offline
    if not _warned_offline:
        logger.warning(
            "GOOGLE_AI_API_KEY is not set \u2014 using deterministic offline "
            "embeddings. Semantic retrieval quality will be poor until a key is "
            "configured; the rest of the pipeline works normally."
        )
        _warned_offline = True

    dims = settings.EMBEDDING_DIMS
    vec = [0.0] * dims
    tokens = re.findall(r"[a-z0-9]+", text.lower()) or [text.lower()]
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        # Spread each token across 8 dimensions deterministically.
        for i in range(0, len(digest), 4):
            idx = int.from_bytes(digest[i : i + 4], "big") % dims
            vec[idx] += 1.0

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def embed_texts(texts: list[str], task_type: str = "retrieval_document") -> list[list[float]]:
    """Batch embed a list of strings. Returns list of 768-dim vectors."""
    if not _has_api_key():
        return [_offline_embedding(t) for t in texts]

    _ensure_configured()
    result = genai.embed_content(
        model=settings.EMBEDDING_MODEL,
        content=texts,
        task_type=task_type,
        output_dimensionality=settings.EMBEDDING_DIMS,
    )
    return result["embedding"]


def embed_text(text: str) -> list[float]:
    """Embed a single string (query side)."""
    if not _has_api_key():
        return _offline_embedding(text)

    _ensure_configured()
    result = genai.embed_content(
        model=settings.EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
        output_dimensionality=settings.EMBEDDING_DIMS,
    )
    return result["embedding"]
