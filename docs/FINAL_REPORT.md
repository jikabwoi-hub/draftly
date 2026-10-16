# Draftly — Final Report

_Phase 10 of the rebuild. A plain-language summary of everything that was inspected,
kept, changed, and removed — plus the live URL, the providers, the AI stack, what was
actually tested, what still needs credentials, the running costs, and how to maintain it._

---

## 1. What was inspected

The **entire repository** (`jikabwoi-hub/draftly`, branch `main`) was read before a
single change was made:

- **Frontend** (`frontend/`) — every page, component, route, the Zustand auth store,
  the Axios client and its JWT refresh interceptor, the design tokens in `index.css`,
  and the Vite/Tailwind configuration.
- **Backend** (`backend/`) — all six Django apps (`accounts`, `billing`, `core`,
  `documents`, `mcp_tokens`, `proposals`), the models, serializers, views, URL routing,
  permission classes, the AI generator + RAG pipeline, the document-security module,
  the Stripe integration, and the production settings block.
- **Infrastructure** — `Dockerfile`, `Procfile`, `railway.json`, `vercel.json`,
  `docker-compose.yml`, `.env.example`, the GitHub Actions workflow, and the docs.
- **Baseline health** — the frontend production build, the backend test suite, database
  migrations, and a live end-to-end smoke test (landing → register → verify → login →
  dashboard).

**Headline finding:** the repository was already a **sophisticated, working full-stack
SaaS — not a broken prototype.** The correct strategy was therefore to **preserve and
improve** it, not rewrite it.

---

## 2. What was kept (the majority of the project)

Everything below was verified working and left functionally intact:

| Area | What was kept |
|---|---|
| **Backend framework** | Django 5.2 + Django REST Framework 3.16 |
| **Data model** | `User`, `Organization` (tenant), `RFP`, `Proposal` (+ 10 sections), `Template`, `Document`, `GenerationEvent`, `StripeEvent` |
| **Authentication** | JWT (simplejwt), email verification, password reset, Google OAuth, demo login |
| **Multi-tenancy** | Org-scoped queries + custom permission classes (`IsOrgMember`, `IsOrgAdmin`, quota permissions) |
| **AI pipeline** | Multi-provider fallback, two-pass generation, sentence-level groundedness scoring |
| **RAG** | pgvector cosine similarity, ~500-word chunks with 50-word overlap, tenant-scoped retrieval, optional Cohere rerank |
| **Billing** | Stripe Checkout + Customer Portal + idempotent signed webhook |
| **Security** | Throttling scopes, PDF sanitization (pikepdf), HSTS/SSL hardening, CORS/CSRF allow-lists, Sentry |
| **Frontend stack** | React 18.3 + Vite 7, Zustand, Tiptap editor, Recharts, framer-motion, lucide-react |
| **App features** | Dashboard/Generator, proposal wizard, editor, knowledge library, templates, upload/export, proposal library, settings |

---

## 3. What was replaced / changed

Only genuinely missing or broken pieces were touched:

1. **Added a public marketing website** at `/` (it did not exist — `/` redirected
   straight to `/login`). It includes the navbar, hero, product preview, features,
   how-it-works, pricing, FAQ, final CTA, and footer, with the exact required copy.
2. **Restructured routing** — `/` is now the public site; the authenticated product
   lives under `/app/*`.
3. **Applied the Apple-inspired liquid-glass design pass** — replaced the loud
   violet→magenta gradients and neon glow shadows with deep graphite surfaces, frosted
   glass, fine hairlines, and restrained accents across the whole app.
4. **Added `netlify.toml`** — SPA fallback, security headers, and asset caching (the
   project was previously Vercel-only).
5. **Fixed stale internal links** — the sidebar nav items, the settings link, and the
   pricing links still pointed at the old top-level routes after the `/app/*` move.
6. **Added an env-driven router switch** (`VITE_USE_HASH_ROUTER`) so the same codebase
   can build for either a root host (Netlify) or a sub-path host (preview).

---

## 4. What was removed

Only dead code — nothing was deleted until its responsibility had a replacement:

- `frontend/src/components/Navbar.jsx` — unused.
- `frontend/src/components/Layout.jsx` — unused (imported the above).
- `frontend/src/pages/Documents.jsx` — unused, still on the old blue/gray styling.

No backend code, model, migration, or endpoint was removed.

---

## 5. Architecture in simple language

Draftly is **two separate programs** that talk to each other over the internet:

```
Visitor's browser
      │
      ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│  Netlify (the website)   │  /api  │  Railway (the "brain")       │
│  static React app        │ ─────► │  Django API + background job │
└──────────────────────────┘        └───────────────┬──────────────┘
                                                    │
              ┌─────────────────────────────────────┼───────────────────────────┐
              ▼                                     ▼                            ▼
   Supabase Postgres + pgvector            Redis (job queue)          AI providers + Stripe
   (data + file storage)                                              (Claude/Gemini/Groq)
```

- **The website (Netlify)** is just files — it loads fast and is cheap to host. It holds
  **no secrets**.
- **The brain (Railway)** is a Django server that does all the real work: it stores data,
  talks to the AI, and processes payments. **All API keys live here, never in the
  browser.**
- **The database (Supabase)** stores users, organizations, proposals, and the company
  knowledge library (with a vector extension for semantic search).
- **The job queue (Redis)** lets long tasks (like indexing a large PDF) run in the
  background so the website stays responsive.

This is the simplest architecture that is still secure and production-grade, and it
matches the target described in the brief: a React SPA on a static host, a server-side
API holding the AI keys, PostgreSQL, and managed file storage.

---

## 6. URLs

| Purpose | URL |
|---|---|
| **Live static preview (public website)** | `https://sites.super.myninja.ai/bc184a5b-8eed-4312-abde-61f409ce0dd8/630464c9/index.html` |
| Source repository | `https://github.com/hassanzafarr/draftly` |
| Local frontend (dev) | `http://localhost:5173` |
| Local backend (dev) | `http://localhost:8000` |
| Backend health check | `https://<backend-host>/api/health/` → `{"status": "ok"}` |

> The preview is a **static build of the public marketing site only**. The authenticated
> app and live AI generation require the backend to be deployed with real credentials
> (see §12). The preview was built with hash routing + relative paths so it works from a
> sub-path; the `dist/` folder in the repo is the standard build for Netlify.

---

## 7. Providers (recommended production stack)

| Layer | Provider | Why |
|---|---|---|
| Frontend hosting | **Netlify** | Free tier, global CDN, reads `netlify.toml` automatically |
| Backend hosting | **Railway** | Runs the Docker image + a Celery worker; simple env-var UI |
| Database | **Supabase** | Managed PostgreSQL 16 with the `pgvector` extension |
| File storage | **Supabase Storage** | S3-compatible, private bucket for uploaded documents |
| Job queue | **Railway Redis** | Celery broker |
| Payments | **Stripe** | Checkout, Customer Portal, signed webhooks |
| Error tracking | **Sentry** | Backend + frontend exception capture |
| Email | SMTP (any provider) | Verification + password-reset emails |

All of these have generous free tiers; see §13 for realistic costs.

---

## 8. AI provider

Draftly uses a **multi-provider fallback chain** so a single outage or rate-limit never
takes the product down:

1. **Anthropic Claude** — primary generator (default `claude-haiku-4-5-20251001`, chosen
   for cost).
2. **Google Gemini 2.5 Flash** — first fallback; **also required for embeddings**
   (`models/gemini-embedding-001`, 768 dimensions) that power the knowledge-library
   search.
3. **Groq `llama-3.1-8b-instant`** — final fallback when the others are rate-limited.
4. **Cohere Rerank** — optional; improves retrieval quality (free tier ≈ 1,000 calls/mo).

The provider order is driven **entirely by environment variables**, so a provider can be
swapped or disabled without a code change. All keys live **only** on the backend.

**Cost control is built in:** per-tier proposal/document quotas, per-scope rate limits
(20 generations/hour by default), four length presets that cap output tokens
(4,000–20,000), input truncation, ~500-word chunked retrieval, cheap-model selection for
small helper calls, and truncation logging.

---

## 9. Authentication system

- **Custom email-based user model** with an `admin` / `member` role.
- **JWT** (short-lived access + longer refresh); the frontend auto-refreshes once on a
  `401`.
- **Email verification is enforced** — a new account is inactive and login is refused
  until the signed link is clicked.
- **Password recovery** via Django's signed tokens with a dedicated throttle.
- **Google OAuth** with a two-step "new user → choose organization name" flow.
- **Protected routes** — the app under `/app/*` requires a session; the public site does
  not.
- **Multi-tenant isolation** — every tenant row carries an `org` key and **every query is
  scoped to `request.user.org`**; there is no client-supplied org id to spoof.

---

## 10. Features that were tested

| Test | Result |
|---|---|
| Frontend production build (`npm run build`) | ✅ PASS (built in ~9s) |
| Backend test suite (`pytest`) | ✅ **95 passed** |
| Database migrations against PostgreSQL 16 + pgvector | ✅ clean |
| `GET /api/health/` | ✅ `{"status": "ok"}` |
| Registration creates User + Organization with quotas | ✅ verified |
| Login blocked until email verified | ✅ verified |
| Email verification activates the account | ✅ verified |
| Login returns JWT tokens | ✅ verified (`POST /api/auth/token/ 200`) |
| Demo login reaches the `/app` dashboard | ✅ verified |
| Landing page renders (hero/features/pricing/FAQ/CTA/footer) | ✅ verified visually |
| Design pass renders correctly across dashboard/templates/pricing | ✅ verified visually |
| Static preview loads from a sub-path | ✅ HTTP 200 |
| Stale-link fix (sidebar/settings/pricing) | ✅ verified |

**What could NOT be tested here (needs real credentials):** live AI generation, Stripe
checkout + webhook, Google OAuth, outbound email delivery, and the deployed
Netlify/Railway/Supabase environments. These are wired correctly in code but were not
exercised end-to-end in this sandbox.

---

## 11. Features that are incomplete / need attention

- **Live integrations are unverified** — AI, Stripe, email, and storage require real keys
  and a deployed backend to confirm end-to-end (the code paths exist and are unit-tested).
- **Pricing is config-driven but not yet connected to live Stripe Prices** — six
  `price_...` ids must be created in Stripe and pasted into env vars.
- **Google OAuth** button is present but non-functional until `VITE_GOOGLE_CLIENT_ID` is
  set.
- **Custom domain** (`draftly.software`) is prepared but not yet attached.
- **Email backend** must be configured (SMTP) for verification/reset mail to actually send.

---

## 12. Credentials you will need to go live

You do **not** need to write any code — you only need to create accounts and paste values
into environment-variable fields. The full list is documented in `docs/ENVIRONMENT.md`;
the minimum to launch is:

- **Django:** `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `FRONTEND_URL`
- **Database:** `DATABASE_URL` (Supabase pooler)
- **Jobs:** `REDIS_URL`
- **AI:** `ANTHROPIC_API_KEY` (+ `CLAUDE_MODEL`, `CLAUDE_ENABLED`),
  `GOOGLE_AI_API_KEY` (+ `GEMINI_MODEL`), optional `GROQ_API_KEY`, optional
  `COHERE_API_KEY`
- **Payments:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_VERSION`, and six `STRIPE_PRICE_*` ids
- **Storage:** `USE_SUPABASE_STORAGE=True` + the five `SUPABASE_STORAGE_*` values
- **Observability:** `SENTRY_DSN`, `CORS_ALLOWED_ORIGINS`
- **Frontend (Netlify):** `VITE_API_URL`, optional `VITE_GOOGLE_CLIENT_ID`,
  optional `VITE_SENTRY_DSN`

---

## 13. Estimated running costs

| Service | Free tier | Realistic paid tier |
|---|---|---|
| Netlify (frontend) | Free (100 GB bandwidth/mo) | ~$19/mo Pro (optional) |
| Railway (backend + worker) | ~$5 trial credit | **~$5–20/mo** (usage-based) |
| Supabase (Postgres + storage) | Free (500 MB DB, 1 GB storage) | **~$25/mo** Pro |
| Redis (Railway plugin) | small usage | ~$5/mo |
| Sentry | Free (5k errors/mo) | ~$26/mo Team (optional) |
| **AI (Claude + Gemini)** | — | **~$5–50/mo** depending on volume |
| Stripe | No monthly fee | 2.9% + 30¢ per transaction |
| Domain | — | ~$12/yr |

**Bottom line:** you can run a low-traffic launch for roughly **$10–40/month**, dominated
by the backend host and AI usage. AI cost is bounded by the built-in quotas and length
presets, so it scales with revenue rather than exploding.

---

## 14. Maintenance steps

1. **Deploy the backend** to Railway (root dir `backend/`) with a Postgres + Redis plugin,
   set the env vars, confirm `/api/health/` returns `ok`.
2. **Deploy the frontend** to Netlify — it reads `netlify.toml`; set `VITE_API_URL` to the
   backend host.
3. **Create the Stripe Prices** and paste the six ids; add the webhook endpoint
   `/api/billing/webhook/`.
4. **Create the Supabase bucket** (`documents`) and S3 keys; enable `USE_SUPABASE_STORAGE`.
5. **Attach the custom domain** in Netlify and update `FRONTEND_URL` / CORS on the backend.
6. **Rotate secrets** if ever leaked; `.env` files are git-ignored — never commit them.
7. **Watch Sentry** after launch for unhandled errors.
8. **Routine:** `pip`/`npm` dependency updates, run `pytest` before deploys, and review AI
   usage vs. quotas monthly.

---

## 15. Limitations & honest notes

- The static preview shows the **public website only**; the app + AI need the live backend.
- Live AI, Stripe, email, OAuth, and storage were **not** verified end-to-end in this
  environment — they are implemented and unit-tested, but require real credentials.
- The public **demo org** is intentionally shared and read-only for documents.
- The environment's `expose_port` mechanism did not work here, so the preview was published
  via the static deploy tool instead; a real Netlify deploy will use normal history routing.
- No fabricated testimonials, statistics, or logos were added anywhere — the marketing site
  describes only real, implemented capabilities.

---

## Deliverables index

| File | Purpose |
|---|---|
| `docs/AUDIT.md` | Phase 1–2: what was inspected + architecture decision |
| `docs/SECURITY.md` | Phase 6: auth, multi-tenancy, throttling, file safety |
| `docs/ENVIRONMENT.md` | Phase 7: every env var + AI cost controls |
| `docs/DEPLOYMENT.md` | Phase 9: step-by-step deploy guide |
| `docs/FINAL_REPORT.md` | Phase 10: this document |
| `netlify.toml` | Frontend deploy config (SPA + headers + caching) |
| `frontend/src/pages/Landing.jsx` + `frontend/src/components/landing/` | Public website |
| `frontend/src/lib/plans.js` | Single source of truth for pricing |
