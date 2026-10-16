# Draftly — Deployment Guide

_Phase 9 of the rebuild. Plain-language steps for a non-technical operator._

## 1. The big picture

Draftly is split into two deployable pieces:

```
┌──────────────────────┐        ┌───────────────────────────┐
│  Netlify (frontend)  │  /api  │  Railway (Django backend) │
│  static React SPA    │ ─────► │  Gunicorn + Celery worker │
└──────────────────────┘        └───────────┬───────────────┘
                                            │
                    ┌───────────────────────┼────────────────────────┐
                    ▼                       ▼                        ▼
          Supabase Postgres          Redis (Celery)           AI providers
          (+ pgvector) + Storage                             (Anthropic/Gemini/Groq)
```

- **Netlify** hosts the static website + app (fast, global CDN, free tier).
- **Railway** runs the Django API and the background worker.
- **Supabase** provides managed PostgreSQL (with the `pgvector` extension) and
  S3-compatible file storage.
- **AI keys and the Stripe secret live only on Railway** — never in the browser.

Everything needed to deploy already exists in the repo:
`netlify.toml`, `backend/Dockerfile`, `Procfile`, `railway.json`,
`docker-compose.yml`, `.env.example`.

---

## 2. Deploy the backend (Railway)

1. Create a Railway project and add a **PostgreSQL** plugin (or point at Supabase
   — see §3). Add a **Redis** plugin.
2. Create a new service from the GitHub repo, set the **root directory to
   `backend/`**. Railway detects `backend/Dockerfile` automatically.
3. The container runs, in order: `collectstatic` → `migrate` → `gunicorn`. No
   manual build step is required.
4. Add a **second service** for the worker using the same repo/Dockerfile but the
   start command from `Procfile`:
   ```
   celery -A config worker --loglevel=info --concurrency 2
   ```
5. Set the environment variables (Railway → Variables). Minimum for a live API:
   ```
   SECRET_KEY=<long-random-string>
   DEBUG=False
   ALLOWED_HOSTS=<your-backend-host>,.up.railway.app
   DATABASE_URL=<from Supabase or Railway Postgres>
   REDIS_URL=<from Railway Redis>
   FRONTEND_URL=https://<your-netlify-site>
   CORS_ALLOWED_ORIGINS=https://<your-netlify-site>
   SENTRY_DSN=<your-sentry-dsn>
   ANTHROPIC_API_KEY=...   CLAUDE_MODEL=claude-haiku-4-5-20251001   CLAUDE_ENABLED=True
   GOOGLE_AI_API_KEY=...   GEMINI_MODEL=gemini-2.5-flash
   GROQ_API_KEY=...        GROQ_MODEL=llama-3.1-8b-instant
   STRIPE_SECRET_KEY=...   STRIPE_PUBLISHABLE_KEY=...
   STRIPE_WEBHOOK_SECRET=...  STRIPE_API_VERSION=2024-11-20.acacia
   STRIPE_PRICE_SOLO_MONTHLY=... (…all six price ids…)
   USE_SUPABASE_STORAGE=True
   SUPABASE_STORAGE_ENDPOINT=...  SUPABASE_STORAGE_BUCKET=documents
   SUPABASE_STORAGE_ACCESS_KEY=...  SUPABASE_STORAGE_SECRET_KEY=...  SUPABASE_STORAGE_REGION=us-east-1
   ```
6. **Verify:** open `https://<backend-host>/api/health/` — it must return
   `{"status": "ok"}`. The Dockerfile also declares a HEALTHCHECK against this
   endpoint.

---

## 3. Database (Supabase)

1. Create a Supabase project. In the SQL editor run `CREATE EXTENSION IF NOT
   EXISTS vector;` (pgvector powers semantic search over your knowledge library).
2. Copy the **Transaction pooler** connection string (port `6543`) into
   `DATABASE_URL`. This is PgBouncer-compatible and correct for Gunicorn.
3. Migrations run automatically on deploy (the Dockerfile's start command). To run
   them manually: `python manage.py migrate`.

---

## 4. File storage (Supabase Storage)

1. Create a private bucket named `documents`.
2. Generate **S3 access keys** (Supabase → Storage → S3 Access Keys).
3. Set `USE_SUPABASE_STORAGE=True` and the five `SUPABASE_STORAGE_*` variables on
   Railway. When off, files are written to the container's local `/media/`
   directory (fine for local dev, not for production).

---

## 5. Deploy the frontend (Netlify)

1. In Netlify, "Add new site → Import an existing project" and pick the repo.
2. Netlify reads `netlify.toml` from the repo root, which sets:
   - **base** = `frontend`
   - **build command** = `npm run build`
   - **publish** = `dist`
   - a **SPA fallback** (`/* → /index.html 200`) so deep links work
   - **security headers** and long-lived caching for hashed assets
3. Add the build-time environment variables (Netlify → Site settings →
   Environment variables):
   ```
   VITE_API_URL=https://<your-backend-host>     # no trailing slash
   VITE_GOOGLE_CLIENT_ID=<google-client-id>     # optional
   VITE_SENTRY_DSN=<sentry-dsn>                 # optional
   ```
4. Trigger a deploy. Netlify builds and publishes the SPA.
5. **Verify:** the landing page loads at the site root; "Get Started" opens
   `/register`; registering creates an account (the request hits
   `VITE_API_URL`).

> **Alternative (no CORS):** uncomment the `/api/*` proxy block in `netlify.toml`,
> set the backend host, and leave `VITE_API_URL` empty so the browser calls the API
> on the same origin.

---

## 6. Custom domain

1. Netlify → Domain management → add `draftly.software` (and `www`). Point the DNS
   records Netlify shows you (or move the nameservers to Netlify).
2. Update the backend env vars to match the new origin:
   `FRONTEND_URL=https://draftly.software` and add it to
   `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`.
3. Netlify provisions a TLS certificate automatically.

---

## 7. Stripe setup (billing)

1. Create six **Prices** in Stripe (Solo/Studio/Agency × monthly/annual) and copy
   their `price_...` ids into the `STRIPE_PRICE_*` variables.
2. Add a webhook endpoint pointing at `https://<backend-host>/api/billing/webhook/`
   and put its signing secret in `STRIPE_WEBHOOK_SECRET`. The webhook is
   idempotent (duplicate events are ignored via the `StripeEvent` table).
3. Test with Stripe test keys first, then swap in live keys.

---

## 8. Local development

```bash
# Option A — everything in Docker
docker compose --profile localdb up

# Option B — run pieces manually
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp ../.env.example .env
python manage.py migrate && python manage.py runserver 8000
# (other terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

`docker-compose.yml` starts Postgres+pgvector, Redis, the backend, the Celery
worker, and the frontend. With `DEBUG=True`, AI keys can be blank — only live
generation needs them.

---

## 9. Verification checklist (post-deploy)

- [ ] `GET /api/health/` → `{"status": "ok"}`
- [ ] Landing page loads at the frontend root.
- [ ] Register → verification email arrives → link activates the account.
- [ ] Sign in returns tokens and lands on `/app`.
- [ ] A proposal can be generated (requires live AI keys).
- [ ] A PDF/DOCX upload indexes and appears in the knowledge library.
- [ ] Export produces a PDF/DOCX.
- [ ] Stripe Checkout opens and the webhook flips the org tier.
- [ ] Sentry shows no new unhandled errors.

---

## 10. Static preview (this environment)

A static build of the marketing site was published for review at:

```
https://sites.super.myninja.ai/bc184a5b-8eed-4312-abde-61f409ce0dd8/630464c9/index.html
```

It was built with `VITE_USE_HASH_ROUTER=true` and a relative `base` so it works
from a sub-path. This preview shows the **public website only** — the
authenticated app and AI generation require the live backend described above.
