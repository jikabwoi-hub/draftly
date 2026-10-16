# Draftly — Repository Audit & Architecture Decision

_Phase 1 (Audit) and Phase 2 (Architecture) of the rebuild._

## 1. What this document is

Before changing anything, the entire repository was inspected: the framework and
versions, whether the backend actually works, how authentication / database / AI /
payments are wired, which components are reusable, which dependencies are
obsolete, and how the project is deployed.

The headline finding: **the existing repository is a sophisticated, working
full-stack SaaS — not a broken prototype.** The correct strategy was therefore to
**preserve and improve** the existing architecture rather than rewrite it. Only
genuinely broken or missing pieces were changed, and nothing was deleted until its
responsibility had a replacement.

## 2. Stack discovered

### Frontend (`frontend/`)
| Concern | Choice |
|---|---|
| Framework | React 18.3 |
| Build tool | Vite 7.3.5 |
| Routing | react-router-dom 6 |
| State | Zustand |
| Rich text editor | Tiptap |
| Charts | Recharts |
| HTTP | Axios (JWT auto-refresh interceptor) |
| Animation | framer-motion 12 |
| Icons | lucide-react |
| Toasts | react-hot-toast |
| File drop | react-dropzone |
| PDF / export | jspdf + html2canvas, docx tooling |
| Auth (Google) | @react-oauth/google |
| Error tracking | @sentry/react |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), OKLCH design tokens |
| Fonts | @fontsource Inter, Space Grotesk, JetBrains Mono |

### Backend (`backend/`)
| Concern | Choice |
|---|---|
| Language | Python 3.11 / 3.12 |
| Framework | Django 5.2 + Django REST Framework 3.16 |
| Auth | djangorestframework-simplejwt (JWT access + refresh) |
| Database | PostgreSQL 16 + pgvector (vector search) |
| Background jobs | Celery 5.4 + Redis |
| Server | Gunicorn + WhiteNoise |
| Error tracking | sentry-sdk |
| Payments | Stripe SDK |
| Config | python-decouple + dj-database-url |
| Apps | accounts, billing, core, documents, mcp_tokens, proposals |

### AI layer
- **Multi-provider fallback:** Anthropic Claude (primary) → Google Gemini 2.5 Flash
  → Groq `llama-3.1-8b-instant`.
- **Embeddings:** Google `models/gemini-embedding-001` (768 dimensions).
- **RAG:** pgvector cosine similarity over ~500-word chunks (50-word overlap),
  tenant-scoped by `org_id`, with optional Cohere reranking.
- **Groundedness:** two-pass generation + sentence-level groundedness scoring so
  the model does not invent facts.

### Deployment files found
- `Procfile` (gunicorn web + celery worker)
- `railway.json`
- `backend/Dockerfile` (multi-step: collectstatic → migrate → gunicorn, with a
  `/api/health/` HEALTHCHECK)
- `docker-compose.yml` (local Postgres+pgvector, Redis, backend, worker, frontend)
- `vercel.json` (root + `frontend/`)
- `.env.example` (comprehensive)

## 3. What worked out of the box (verified)

- Frontend production build (`npm run build`) — **PASS**.
- Backend test suite (`pytest`) — **95 passed**.
- Database migrations apply cleanly against PostgreSQL 16 + pgvector 0.7.4.
- `GET /api/health/` → `{"status": "ok"}`.
- Registration creates a `User` + `Organization` with quotas.
- Login is correctly blocked until the email is verified.
- Email verification activates the account; login then returns JWT tokens.
- Demo login works; `GET /api/auth/me/` returns the demo organization.

## 4. Gaps found

1. **No public marketing website.** The root path `/` redirected straight to
   `/login`. There was no way for a visitor to understand the product before
   signing up — a hard blocker for a SaaS launch.
2. **Design language mismatch.** The app used a vivid violet→magenta "glow"
   aesthetic (glowing buttons, starfield, neon gradients) — the opposite of the
   requested Apple-inspired graphite / liquid-glass direction.
3. **No Netlify configuration.** The frontend was configured for Vercel only.
4. **Dead code.** `components/Layout.jsx`, `components/Navbar.jsx`, and
   `pages/Documents.jsx` were unused and still referenced the old route layout.
5. **Route-layout drift.** After moving the app under `/app/*`, several internal
   links (the sidebar nav items, a settings link, pricing links) still pointed at
   the old top-level paths.

## 5. Architecture decision (Phase 2)

**Decision: preserve and improve the existing Django + React architecture.**

Rationale:
- The backend is genuinely production-grade: multi-tenant data model, JWT auth,
  Stripe billing with idempotent webhooks, RAG pipeline, throttling, Sentry, and a
  hardened production settings block. Replacing it would destroy working, valuable
  code and add weeks of risk for no user-visible benefit.
- The frontend is a clean, modern React/Vite SPA. It only needed a new public
  surface, a design pass, and routing fixes — not a rebuild.
- The stack matches the target architecture: React SPA on a static host, a
  server-side API holding the AI keys, PostgreSQL, and managed file storage.

Target production topology:
```
Browser ──► Netlify (React SPA, static)
                │  fetch /api/*  (VITE_API_URL)
                ▼
        Django + DRF API (Gunicorn)  ──► PostgreSQL + pgvector (Supabase)
                │                     ──► Redis (Celery broker)
                ├─► Anthropic / Gemini / Groq  (AI, server-side keys only)
                └─► Stripe (billing)
```

The AI provider keys live **only** in the backend environment — they are never
shipped to the browser.

## 6. Changes made as a result

- Added a complete public marketing site (`/`) with the exact required copy, a
  product preview built from real components, features, how-it-works, config-driven
  pricing, FAQ, final CTA, and footer.
- Restructured routes: `/` = public site, `/app/*` = the authenticated product.
- Applied a deep-graphite / liquid-glass design pass and removed the loud
  violet→magenta gradients and glow shadows across the app.
- Added `netlify.toml` (SPA fallback + security headers + cache rules).
- Fixed the stale internal links and removed the dead components.
- Wrote the deployment, security, environment, and final-report documentation.

## 7. What was deliberately NOT changed

- The Django data model, migrations, and multi-tenant permission classes.
- The AI provider abstraction and RAG pipeline.
- The Stripe billing integration and webhook handling.
- The existing auth flows (register / login / refresh / reset / verify / Google /
  demo) — only their visual styling and post-login redirect target were updated.
