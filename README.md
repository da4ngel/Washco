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
```

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

## Build order (implementation phases)

This project was built as a vertical slice and then expanded:

- **Phase 0** — scaffold, config, DB migration + seed, dev servers boot ✅
- **Phase 1** — auth (user + tenant)
- **Phase 2** — browse → tenant detail → book → Stripe pay
- **Phase 3** — tenant dashboard (status transitions, photos, schedule, payouts)
- **Phase 4** — user dashboard, profile, reviews, notifications
- **Phase 5** — admin approvals, revenue, analytics
- **Phase 6** — realtime updates + polish
