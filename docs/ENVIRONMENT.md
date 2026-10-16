# Draftly — Environment Variables & AI Cost Control

_Phase 7 of the rebuild. Copy `.env.example` to `.env` and fill in real values.
Never commit a populated `.env`._

## 1. Environment variables

### Core Django
| Variable | Required | Notes |
|---|---|---|
| `SECRET_KEY` | ✅ prod | Long random string. Rotate if leaked. |
| `DEBUG` | ✅ | `False` in production (enables HTTPS/HSTS hardening). |
| `ALLOWED_HOSTS` | ✅ prod | Comma-separated hosts, e.g. `draftly.software,.up.railway.app`. |
| `FRONTEND_URL` | ✅ | Public SPA origin, no trailing slash (used for Stripe redirects + email links). |

### Database
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ prod | Full Postgres URI (Supabase "Transaction" pooler, port 6543). |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | dev | Used when `DATABASE_URL` is unset (local Postgres). |

### Cache / jobs
| Variable | Required | Notes |
|---|---|---|
| `REDIS_URL` | ✅ prod | Celery broker/result backend. |

### Frontend (build-time, public)
| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend origin; the client appends `/api`. Empty ⇒ same-origin `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | optional | Enables "Continue with Google". |
| `VITE_SENTRY_DSN` | optional | Frontend error tracking. |

### AI providers (server-side only)
| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ (primary) | Claude generation. |
| `CLAUDE_MODEL` | ✅ | e.g. `claude-haiku-4-5-20251001`. |
| `CLAUDE_ENABLED` | ✅ | Toggle the primary provider. |
| `GOOGLE_AI_API_KEY` | ✅ | **Required for embeddings** + Gemini fallback. |
| `GEMINI_MODEL` | ✅ | e.g. `gemini-2.5-flash`. |
| `GROQ_API_KEY` | optional | Final fallback when Gemini is rate-limited. |
| `GROQ_MODEL` | optional | e.g. `llama-3.1-8b-instant`. |
| `COHERE_API_KEY` | optional | Reranking (free tier ≈ 1000 calls/mo). |
| `RERANK_ENABLED` / `RERANK_FETCH_TOP_K` / `RERANK_KEEP_TOP_K` | optional | Retrieval tuning. |

### Billing (Stripe)
| Variable | Required | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | ✅ | Server-side only. |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Public. |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Verifies webhook signatures. |
| `STRIPE_API_VERSION` | ✅ | Pins API behaviour. |
| `STRIPE_PRICE_SOLO_MONTHLY` … `STRIPE_PRICE_AGENCY_ANNUAL` | ✅ | Six price ids created in Stripe. |

### Storage
| Variable | Required | Notes |
|---|---|---|
| `USE_SUPABASE_STORAGE` | ✅ prod | `True` ⇒ S3-compatible Supabase Storage; `False` ⇒ local `/media/`. |
| `SUPABASE_STORAGE_ENDPOINT` / `_BUCKET` / `_ACCESS_KEY` / `_SECRET_KEY` / `_REGION` | when storage on | S3 credentials. |

### Observability & hardening
| Variable | Required | Notes |
|---|---|---|
| `SENTRY_DSN` | ✅ prod | Backend error tracking (startup warns if missing). |
| `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_SEND_DEFAULT_PII` | optional | |
| `CORS_ALLOWED_ORIGINS` | ✅ | Comma-separated allowed origins. |
| `ADMIN_IP_ALLOWLIST`, `ADMIN_TRUSTED_PROXY_COUNT` | optional | IP-gate `/admin/`. |
| `THROTTLE_*` | optional | Override any throttle rate (see §3). |

## 2. AI cost-control measures (implemented)

1. **Usage quotas per tier.** Each org has a `doc_quota` and a `proposal_quota`
   (see `Organization.QUOTA`). Generation is blocked by
   `OrgProposalQuotaPermission` once the monthly (or daily, for demo) limit is
   reached. Free = 3 proposals; Solo = 25; Studio = 150; Agency = 750.
2. **Rate limiting.** `proposal_generate` = 20/hour, `document_upload` = 30/hour
   by default, on top of the global `user` (240/min) / `anon` (30/min) limits.
3. **Length presets cap the output budget.** The user picks a length, and each
   preset sets a per-section word target, a total word cap, and a hard
   `max_tokens` ceiling:

   | Length | Per section | Total cap | LLM `max_tokens` |
   |---|---|---|---|
   | Concise | 80–120 words | 1,500 | 4,000 |
   | Standard | 150–250 words | 3,000 | 8,000 |
   | Detailed | 300–450 words | 5,000 | 14,000 |
   | Comprehensive | 500–700 words | 8,000 | 20,000 |

4. **Input-size caps.** RFP excerpts are truncated before prompting; PDFs are
   capped at 50 MB; text is chunked (~500 words, 50-word overlap) so retrieval
   pulls only the most relevant passages rather than the whole corpus.
5. **Cheap-model selection.** Small helper calls (title generation, intent
   classification) use tiny token budgets (30 / 400 / 1024 / 1500) instead of a
   full generation call.
6. **Replaceable provider config.** The provider order (Claude → Gemini → Groq) is
   driven entirely by env vars, so a provider can be swapped or disabled without a
   code change.
7. **Truncation detection.** The pipeline logs when a provider hits `max_tokens`
   so silent truncation is visible in logs/Sentry.

## 3. Overriding throttle rates

Every rate is an env var with a safe default, e.g.:

```
THROTTLE_ANON=30/min
THROTTLE_USER=240/min
THROTTLE_AUTH_LOGIN=10/min
THROTTLE_AUTH_REGISTER=5/hour
THROTTLE_PROPOSAL_GENERATE=20/hour
THROTTLE_DOCUMENT_UPLOAD=30/hour
THROTTLE_BILLING_CHECKOUT=10/hour
THROTTLE_PASSWORD_RESET=5/hour
THROTTLE_TEAM_INVITE=20/hour
THROTTLE_DEMO_LOGIN=20/hour
```

## 4. Local development quick start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env          # fill in values (DEBUG=True, local DB)
python manage.py migrate
python manage.py runserver 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173, proxies /api → :8000
```

With `DEBUG=True`, AI keys may be left blank — the app runs; only live AI
generation requires real provider keys.
