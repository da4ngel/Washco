# WashCo — Car Wash Marketplace

A production-ready, two-sided marketplace connecting car wash businesses with customers in Colombo, Sri Lanka. Customers browse, book, and pay; tenants manage bookings and earnings; admins approve tenants and track platform revenue.

**Stack:** React 18 + Vite + TypeScript · Tailwind + shadcn-style UI · Zustand · TanStack Query · React Hook Form + Zod · Node.js + Express (TS) · Supabase (Postgres/Auth/Storage/Realtime) · Stripe.

---

## Monorepo layout

```
washco/
├── frontend/     # React + Vite app (customer, tenant, admin UIs)
├── backend/      # Express API (all business logic)
├── database/     # SQL migration + seed
├── .env.example  # every environment variable
└── package.json  # root dev/build scripts (npm workspaces)
```

The frontend talks to the **Express API** for all business logic. It uses the Supabase client directly **only** for auth sessions, realtime subscriptions, and storage uploads. The Supabase **service-role key lives on the backend only** and is never shipped to the browser.

---

## Prerequisites

- Node.js 20+ and npm 10+
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Stripe](https://stripe.com) account (test mode)
- (Optional) A Google Maps JavaScript API key for the map view

---

## 1. Install

```bash
npm install            # installs root + frontend + backend (workspaces)
```

## 2. Configure Supabase

1. Create a new Supabase project. Note the **Project URL**, **anon key**, and **service_role key** (Project Settings → API), and the **JWT Secret** (Project Settings → API → JWT Settings).
2. Open the **SQL Editor** and run, in order:
   - `database/migrations/001_initial_schema.sql`
   - `database/seed/seed.sql` (optional demo data)
3. Create three **Storage buckets** (Storage → New bucket):
   | Bucket | Public | Notes |
   |---|---|---|
   | `tenant-photos` | Public | Business gallery images (≤5 MB, images only) |
   | `booking-photos` | Private | Before/after photos, served via signed URLs (≤10 MB) |
   | `avatars` | Public | User avatars (≤2 MB) |

## 3. Configure Stripe

1. Copy your **Secret key** and **Publishable key** (test mode) from the Stripe dashboard.
2. For local webhooks, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```
   Copy the printed `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`.

## 4. Environment variables

Copy `.env.example` and fill in the values:

```bash
cp .env.example backend/.env      # backend secrets (service role, stripe secret, jwt)
cp .env.example frontend/.env     # keep only the VITE_* values here
```

- **backend/.env**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`.
- **frontend/.env**: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GOOGLE_MAPS_API_KEY`.

> The apps boot even with blank credentials (placeholder mode) so you can develop the UI, but live data/auth/payment calls require real values.

## 5. Run

```bash
npm run dev            # starts backend (:4000) and frontend (:5173) together
```

- Frontend: http://localhost:5173
- API health check: http://localhost:4000/api/health

Other scripts:

```bash
npm run build          # typecheck + build both apps
npm run typecheck      # tsc --noEmit for both apps
npm test               # run backend + frontend unit tests (Vitest)
```

---

## Testing & CI

Unit tests run with **Vitest** in both workspaces (no live Supabase/Stripe needed):

```bash
npm test                          # both workspaces
npm run test --workspace backend  # backend only (pricing, slot logic, schemas, helpers)
npm run test --workspace frontend # frontend only (auth store, routing, formatters, a component)
```

GitHub Actions (`.github/workflows/ci.yml`) runs `typecheck → test → build` on every push and PR to `main`.

---

## Demo accounts (after running the seed)

All use the password **`Password123!`**:

| Email | Role |
|---|---|
| `admin@washco.lk` | admin |
| `owner.a@washco.lk` | tenant (Speedy Wash, Rapid Rinse) |
| `owner.b@washco.lk` | tenant (AquaShine Auto Spa) |
| `customer@washco.lk` | customer |

---

## End-to-end verification checklist

With real Supabase + Stripe keys and `stripe listen` running:

1. Register a customer → log in.
2. Browse `/search` → open a car wash → **Book**.
3. Pick service → date → slot → confirm → pay with test card `4242 4242 4242 4242` (any future expiry, any CVC).
4. The webhook flips the booking to **confirmed / paid** and increments the slot.
5. Log in as the tenant owner → **Bookings** → confirm → mark in-progress → upload before/after photos → complete.
6. Back as the customer → leave a review on the completed booking.
7. Log in as admin → approve the pending tenant, view revenue.

---

## Additional sign-in methods

Alongside email/password, WashCo supports **Google OAuth** and **phone (SMS) OTP**. Both are
handled by Supabase Auth on the client — a new `auth.users` row automatically gets a `profiles`
row (via the `on_auth_user_created` trigger), defaulting to the `user` role. Each needs a one-time
provider setup in external dashboards:

### Google OAuth

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID* (type: Web).
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. **Supabase** → Authentication → Providers → **Google** → enable, paste the Client ID + Secret.
3. Add your site URL and `…/auth/callback` to Supabase → Authentication → URL Configuration
   (Redirect URLs). The app redirects to `/auth/callback` after consent.

The "Continue with Google" button appears on the login and register pages.

### Phone OTP (SMS)

1. **Supabase** → Authentication → Providers → **Phone** → enable and connect an SMS provider
   (Twilio, MessageBird, or Vonage — this requires a **paid** SMS account).
2. Users pick the **Phone** tab on the login page, enter a number in E.164 format
   (e.g. `+94771234567`), and verify the 6-digit code.

### Transactional email (SMTP)

Notifications are stored in-app **and** emailed for key events (booking confirmed, new booking,
tenant approved/rejected, cancellation/refund). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `EMAIL_FROM` in `backend/.env` (works with Gmail app passwords, Amazon SES, Mailgun,
Postmark, …). **If SMTP is unset, email silently no-ops** and only the in-app notification fires.

---

## Deployment (Render + Vercel)

The API and frontend deploy independently.

### Backend → Render

- `render.yaml` (repo root) defines a `web` service: build `npm ci && npm run build:backend`,
  start `npm run start`, health check `/api/health`.
- In the Render dashboard, set the env vars marked `sync: false`: `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and `CORS_ORIGIN`
  (your Vercel URL). SMTP and Stripe vars are optional (the app boots without them).

### Frontend → Vercel

- `frontend/vercel.json` sets the Vite build + SPA rewrite (so `/wash/:slug`, `/auth/callback`,
  etc. resolve on refresh). Set the project root to `frontend/`.
- Set the `VITE_*` env vars in Vercel; point `VITE_API_URL` at the Render API URL.

After both are live, set the backend `CORS_ORIGIN` to the Vercel domain and add that domain +
`…/auth/callback` to Supabase's redirect allowlist.

---

## Build order (implementation phases)

This project was built as a vertical slice and then expanded:

- **Phase 0** — scaffold, config, DB migration + seed, dev servers boot ✅
- **Phase 1** — auth (user + tenant)
- **Phase 2** — browse → tenant detail → book → Stripe pay
- **Phase 3** — tenant dashboard (status transitions, photos, schedule, payouts)
- **Phase 4** — user dashboard, profile, reviews, notifications
- **Phase 5** — admin approvals, revenue, analytics
- **Phase 6** — realtime updates + polish
