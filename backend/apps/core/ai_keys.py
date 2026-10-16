"""Centralised checks for which AI providers are configured.

The product is designed to work (in a reduced, non-AI mode) with **no** API
keys set \u2014 see ``docs/ENVIRONMENT.md``. Historically several call sites still
invoked the Google SDK with an empty key, which made the SDK fall back to
Application Default Credentials and hang for ~60s trying to reach the GCP
metadata server before failing. Every provider entry point should therefore ask
these helpers first and take a graceful path when a provider is unavailable.
"""

from django.conf import settings


def gemini_configured() -> bool:
    return bool((getattr(settings, "GOOGLE_AI_API_KEY", "") or "").strip())


def claude_configured() -> bool:
    return bool(
        getattr(settings, "CLAUDE_ENABLED", False)
        and (getattr(settings, "ANTHROPIC_API_KEY", "") or "").strip()
    )


def groq_configured() -> bool:
    return bool((getattr(settings, "GROQ_API_KEY", "") or "").strip())


def any_provider_configured() -> bool:
    """True if at least one text-generation provider is usable."""
    return gemini_configured() or claude_configured() or groq_configured()
