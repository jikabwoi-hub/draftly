# Draftly — Security & Data-Integrity Model

_Phase 6 of the rebuild. This describes what is actually implemented in the code._

## 1. Identity & authentication

- **Custom user model** (`apps.accounts.models.User`, `AbstractBaseUser` +
  `PermissionsMixin`) keyed on email, with a `role` field (`admin` / `member`).
- **JWT auth** via `djangorestframework-simplejwt`: short-lived **access** token +
  longer-lived **refresh** token. The frontend Axios client attaches the access
  token to every request and transparently refreshes it once on a `401`
  (see `frontend/src/api/client.js`).
- **Email verification is enforced.** A freshly registered account is inactive and
  login is refused with _"Please verify your email address before logging in."_
  until the signed uid+token link is clicked (`/api/auth/verify-email/`).
- **Password recovery** uses Django's signed token generator with a scoped
  `password_reset` throttle.
- **Google OAuth** (`@react-oauth/google` → `/api/auth/google/`) with a two-step
  "new user → choose org name" flow.

## 2. Multi-tenancy & authorization (server-side)

Every tenant-owned row carries an `org` foreign key. **Every query is scoped to
`request.user.org`** — there is no client-supplied org id that could be spoofed:

```python
rfps = RFP.objects.filter(org=request.user.org)
proposal = Proposal.objects.get(pk=pk, org=request.user.org)
```

Custom DRF permission classes (`apps/core/permissions.py`) enforce the rules:

| Permission | Enforces |
|---|---|
| `IsOrgMember` | Authenticated **and** belongs to an organization |
| `IsOrgAdmin` | Org member with the `admin` role (team management) |
| `NotDemoOrgWritePermission` | The shared demo org is read-only for documents |
| `OrgDocQuotaPermission` | Blocks uploads once the tier's document quota is hit |
| `OrgProposalQuotaPermission` | Blocks generation once the monthly proposal quota is hit |

The quota permission aligns the counting window to the **Stripe billing period**
for paid plans (so annual subscribers don't reset on the 1st of the month), and to
a **daily** window for the demo org.

## 3. Rate limiting (throttling)

DRF throttling is enabled globally with per-scope rates (all overridable by env
var):

| Scope | Default | Protects |
|---|---|---|
| `anon` | 30/min | Unauthenticated baseline |
| `user` | 240/min | Authenticated baseline |
| `auth_login` | 10/min | Credential stuffing |
| `auth_register` | 5/hour | Fake-account floods |
| `password_reset` | 5/hour | Reset-email abuse |
| `password_change` | 5/hour | Account takeover attempts |
| `proposal_generate` | 20/hour | AI cost abuse |
| `document_upload` | 30/hour | Storage / ingestion abuse |
| `billing_checkout` | 10/hour | Checkout spam |
| `team_invite` | 20/hour | Invite spam |
| `demo_login` | 20/hour | Demo-account abuse |

## 4. Input validation & file safety

- **PDF sanitization** (`apps/documents/security.py`): every uploaded PDF is
  inspected with `pikepdf` and stripped of dangerous constructs before it reaches
  the ingestion pipeline — embedded JavaScript/`/JS`, `/Launch` actions, embedded
  files, `/RichMedia`, `/Movie`/`/Sound`, external `GoToR`/`GoToE` links, and
  `SubmitForm`/`ImportData` actions. Unsafe files are rejected with a readable
  reason.
- **Hard size cap:** 50 MB per PDF (`MAX_PDF_BYTES`), plus a `%PDF-` magic-byte
  check so renamed non-PDFs are rejected.
- **Serializer validation** on every write endpoint (DRF serializers).
- **No secrets in the frontend.** AI provider keys, Stripe secret key, and the
  Django `SECRET_KEY` live only in backend environment variables. The frontend
  bundle contains only public values (`VITE_*`).

## 5. Transport & browser hardening

When `DEBUG=False`, the backend enables:

- `SECURE_SSL_REDIRECT = True` (HTTP → HTTPS)
- `SECURE_HSTS_SECONDS = 31536000` with `INCLUDE_SUBDOMAINS` and `PRELOAD`
- `SECURE_PROXY_SSL_HEADER` so Django trusts the proxy's `X-Forwarded-Proto`
- `SESSION_COOKIE_SECURE` / `CSRF_COOKIE_SECURE`
- `SECURE_REFERRER_POLICY = "same-origin"`

The static frontend (Netlify) ships these response headers (`netlify.toml`):
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, a restrictive
`Permissions-Policy`, and `X-XSS-Protection`.

## 6. CORS & CSRF

- **CORS** is allow-listed (`django-cors-headers`). Only the configured origins
  (production domain(s) + localhost in dev) may call the API; `CORS_ALLOW_ALL_ORIGINS`
  is only ever true when `DEBUG` is on.
- **CSRF trusted origins** mirror the CORS list. The API is JWT-based (bearer
  tokens, not cookies) for authenticated calls, so cross-site request forgery via
  ambient cookies is not applicable to the API surface.

## 7. Secrets management

| Secret | Where it lives | Never in |
|---|---|---|
| `SECRET_KEY` | backend env | repo / bundle |
| `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `COHERE_API_KEY` | backend env | bundle |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | backend env | bundle |
| `DATABASE_URL` | backend env | repo |
| `VITE_*` values | build-time (public) | — |

`.env` files are git-ignored. `.env.example` documents every variable with no real
values.

## 8. Payments integrity

- Stripe Checkout + Customer Portal; the **webhook** verifies the Stripe signature
  and is **idempotent** via the `StripeEvent` model (an event id is recorded once
  and never reprocessed), so retries can't double-apply a subscription change.

## 9. Error visibility

Sentry (backend + frontend) captures unhandled exceptions. In production the
backend **warns loudly at startup if `SENTRY_DSN` is unset**, because otherwise
500s would be invisible.

## 10. Known limitations

- The public **demo org** is intentionally shared and read-only for documents;
  writes are blocked by `NotDemoOrgWritePermission`.
- Google OAuth requires the client id to be configured; without it the button is
  present but non-functional.
- Live AI, Stripe, and storage integrations require real credentials and were
  **not** exercised end-to-end in this environment (see the final report).
