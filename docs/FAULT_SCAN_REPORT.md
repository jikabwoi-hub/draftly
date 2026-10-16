# Draftly — Fault Scan & Repair Report

**Scope:** Full-stack scan of the Draftly webapp (React 18 + Vite frontend, Django 5 + DRF backend, Celery/Redis workers, Postgres + pgvector) to find faults, repair them, and provide a temporary working access path to the authenticated app.

**Environment:** local sandbox, `DEBUG=True`, no live AI provider keys, no live Stripe keys, console email backend.

---

## 1. Summary

| # | Area | Severity | Status |
|---|------|----------|--------|
| 1 | Auth — email links pointed at an unreachable `localhost` URL | **High** | ✅ Fixed |
| 2 | Document ingestion — PDF security walk was exponential (DoS/hang) | **High** | ✅ Fixed |
| 3 | AI — embeddings & generation hung ~60s then failed with no API key | **High** | ✅ Fixed |
| 4 | Runtime — Redis/Celery not running, so generation returned 503 | **Medium** | ✅ Resolved |
| 5 | Config — CORS/FRONTEND_URL not aligned with the public tunnel | **Medium** | ✅ Fixed |

After the fixes: backend test suite **95 passed**, frontend production build **PASS**, full generate flow works end-to-end, and the app is reachable at the temporary public URL below.

---

## 2. Faults found & repairs

### Fault 1 — Auth: verification / reset / invite emails linked to an unreachable host

**Symptom.** After registering, the verification email link pointed at `http://localhost:4173/verify-email?...` (the value of `FRONTEND_URL`). A user opening that link from anywhere other than the developer's own machine hit a dead page, so they could never verify their email, and — because email verification is enforced — could never log in. The same bug affected password-reset and team-invite links.

**Root cause.** `apps/accounts/views.py` built every outbound link from the static `settings.FRONTEND_URL`. When the app is served through a tunnel / reverse proxy / custom domain, that static value is wrong.

**Fix.** Added two helpers and used them to build all outbound links:

- `_trusted_frontend_origins()` — collects the allow-listed origins from `CORS_ALLOWED_ORIGINS` plus `FRONTEND_URL`.
- `_frontend_base_url(request)` — prefers the request's `Origin` header (falling back to the `Referer`'s scheme+host), **but only if that origin is in the trusted allow-list**; otherwise it falls back to `FRONTEND_URL`.

This means links now resolve to whatever host the user is actually using (tunnel, custom domain, localhost), while an attacker cannot poison the link by sending a spoofed `Origin` (untrusted origins are ignored). Applied to:

- `register` → `/verify-email?uid=...&token=...`
- `password_reset_request` → `/reset-password?uid=...&token=...`
- `team_invites` → `/accept-invite?token=...`

**Verification.** Registered a fresh user through the public URL; the Django console showed the verification link using the **public tunnel host**, and `grep` for `localhost:4173` in generated links returned 0 hits.

---

### Fault 2 — Document ingestion: exponential PDF security walk (DoS / hang)

**Symptom.** `seed_demo` (and any real ingestion) took **~40 s per document** and appeared to hang; the whole seed operation exceeded the 60 s command timeout. With more documents the process would effectively never finish — a trivial denial-of-service vector, since a crafted PDF with a shared sub-graph or object cycle would blow up CPU/memory.

**Root cause.** `apps/documents/security.py::_walk_object` recursed into every referenced object with **no memoization**. PDFs frequently reference the same indirect object from many places (and can contain cycles), so the walk re-visited shared sub-graphs exponentially.

**Fix.** `_walk_object` now takes a `visited: set[tuple[int,int]]` of `(objnum, gen)`. Already-scanned indirect objects (`objgen != (0,0)`) are skipped. `validate_and_sanitize_pdf` creates one `visited` set and passes it to both the root walk and the orphan-object sweep.

**Verification.** Seed ingestion dropped from ~40 s/doc to **1.9 s total for all 9 documents** (~200× faster). Behaviour is unchanged for genuine threats — the scanner still detects and flags the same threat patterns, it just doesn't re-scan shared objects.

---

### Fault 3 — AI: embeddings and generation hung ~60 s then failed when no API key is set

**Symptom.** With blank AI keys, two code paths blocked for ~60 s and then raised:

- `apps/core/embeddings.py` called the Google GenAI SDK, which — finding no `GOOGLE_AI_API_KEY` — silently fell back to Application Default Credentials and tried to reach the GCP metadata server, timing out with `DefaultCredentialsError`.
- `apps/proposals/generator.py` and `validators.py` did the same on the generation / intent-classification paths.

So a fresh clone with no keys could not ingest documents or generate proposals at all — it just hung.

**Fix.** Graceful degradation instead of a hard dependency on live keys:

- New `apps/core/ai_keys.py` with `gemini_configured()`, `claude_configured()`, `groq_configured()`, `any_provider_configured()`.
- `embeddings.py`: when `GOOGLE_AI_API_KEY` is blank, `embed_texts`/`embed_text` return a **deterministic offline embedding** (SHA-256 → 768-dim, L2-normalised), logged once. No network call, no hang. Dimensions match the real provider so the pgvector schema is unchanged.
- `generator.py`: `_ensure_configured()` fails fast (no SDK call) if Gemini isn't configured; `_analyze_rfp()` returns `{}` early when no provider is configured; and when no provider is configured at all, generation uses a new **`_generate_local_template(...)`** that produces a complete, correctly-sectioned draft from the RFP brief (client, industry, requirements, compliance, timeline, budget) — so the product still demos end-to-end.
- `validators.py`: `classify_rfp_intent` skips the LLM call and returns a confident heuristic result when no provider is configured (so short demo prompts aren't wrongly rejected).

**Verification.** Full generate flow (create RFP → `POST /rfps/<id>/generate/` → 202 → Celery) now completes quickly with `provider = "local-template"`, producing a `draft` proposal with all 10 sections. No more 60 s hang.

---

### Fault 4 — Runtime: Redis / Celery not running → generation returned 503

**Symptom.** `POST /rfps/<id>/generate/` returned **503** because the task queue broker was unreachable.

**Root cause.** The sandbox had no Redis server and no Celery worker running; proposal generation is dispatched to Celery.

**Resolution.** Installed and started Redis (`redis-server --daemonize yes --save "" --appendonly no`) and a Celery worker (`celery -A config worker -l info --concurrency=2`). Both are documented as required runtime services in `docs/ENVIRONMENT.md`.

---

### Fault 5 — Config: CORS / FRONTEND_URL not aligned with the public tunnel

**Symptom.** When the app was reached through the tunnel, API calls could be rejected by CORS and outbound email links were still wrong (Fault 1).

**Fix.** Updated `backend/.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,https://jean-certainly-anne-licensing.trycloudflare.com
FRONTEND_URL=https://jean-certainly-anne-licensing.trycloudflare.com
```

The tunnel origin is added to the trusted allow-list, which Fault 1's helper uses to build correct links.

---

## 3. Scan coverage (no faults found)

- **Auth flow (end-to-end):** register → verify → login → refresh → password reset → team invite/accept → demo login → Google OAuth entry points. All behave correctly (see Fault 1 for the one link bug, now fixed).
- **API route mapping:** every frontend `api.get/post/put/patch/delete` call was cross-checked against backend URL configs (`apps/accounts/urls.py`, `apps/proposals/urls.py`, `config/urls.py`). **No mismatches.**
- **Frontend pages/components:** Login, Register, VerifyEmail, ForgotPassword, ResetPassword, AcceptInvite, Landing, Pricing, Generator, NewRFP, Proposals, Editor, Knowledge, Analytics, Settings, Templates. All render; browser run showed **0 console errors**.
- **Design tokens:** `violet`, `cyan`, `magenta`, `emerald`, `amber`, `surface`, `surface-1/2/3`, `hairline` are legitimate oklch design-system colours — **not** faults.
- **Backend tests:** `pytest` → **95 passed** (2.29 s).
- **Frontend build:** `npm run build` → **PASS** (12.63 s).

---

## 4. Temporary access to the main (authenticated) webapp

- **URL:** https://jean-certainly-anne-licensing.trycloudflare.com
- **How to sign in:** open `/login` and click **“View demo account”**. This calls `POST /api/auth/demo-login/` and drops you straight into `/app` (Generator) as the demo user (`demo@draftly.software`), with a pre-seeded knowledge base (9 documents · 21 chunks) and a generated sample proposal.
- **Health check:** `GET /api/health/` → `{"status": "ok"}`.

> Note: this is a **quick Cloudflare tunnel** bound to the current sandbox process — it is temporary and will stop when the sandbox/process ends. For a permanent URL, deploy the frontend (`netlify.toml`/`vercel.json`) and backend (`railway.json`/Docker) per `docs/DEPLOYMENT.md`.

---

## 5. Files changed

| File | Change |
|------|--------|
| `backend/apps/accounts/views.py` | Trusted-origin helpers; correct email-link host for verify/reset/invite |
| `backend/apps/core/ai_keys.py` | **New** — provider-configuration helpers |
| `backend/apps/core/embeddings.py` | Deterministic offline embedding fallback when no key |
| `backend/apps/documents/security.py` | Visited-set memoization → linear PDF security walk |
| `backend/apps/proposals/generator.py` | Fail-fast config guard + local-template generation fallback |
| `backend/apps/proposals/validators.py` | Skip LLM intent check when no provider configured |
| `backend/.env` | CORS + FRONTEND_URL aligned with public tunnel |
| `frontend/vite.config.js` | Allowed tunnel hosts for the dev server |

---

## 6. Remaining limitations (not faults)

- **No live AI keys** → generation uses the deterministic local template; add `GOOGLE_AI_API_KEY` / `ANTHROPIC_API_KEY` / `GROQ_API_KEY` for real model output.
- **No live Stripe keys** → checkout/portal return a graceful “not configured” state.
- **Console email backend** → verification/reset emails are printed to the server log, not delivered. Configure SMTP for real delivery.
- **Quick tunnel** → temporary URL (see §4).
