# WashCo — Live Verification Checklist

This walks through the full product end-to-end. It requires real Supabase + Stripe
credentials (see `README.md` for setup). Until those are configured the apps run in
**placeholder mode**: the UI renders and typechecks, but data/auth/payment calls fail.

## 0. Prerequisites

- [ ] `npm install` at the repo root.
- [ ] Supabase project created; `database/migrations/001_initial_schema.sql` run.
- [ ] (Optional) `database/seed/seed.sql` run for demo data + accounts.
- [ ] Storage buckets created: `tenant-photos` (public), `booking-photos` (private), `avatars` (public).
- [ ] `backend/.env` filled: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`.
- [ ] `frontend/.env` filled: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, (optional) `VITE_GOOGLE_MAPS_API_KEY`.
- [ ] In one terminal: `stripe listen --forward-to localhost:4000/api/payments/webhook` (paste the `whsec_…` into `STRIPE_WEBHOOK_SECRET`).
- [ ] `npm run dev` — backend on :4000, frontend on :5173. `curl localhost:4000/api/health` → `{"status":"ok", ...}`.

## 1. Automated gate (no credentials needed)

- [ ] `npm run typecheck` — zero errors in backend and frontend.
- [ ] `npm run build` — both apps build.

## 2. Customer flow

- [ ] Register a customer at `/register` → you land on `/dashboard`.
- [ ] Browse `/search`, apply a rating filter, toggle the map view.
- [ ] Open a car wash (`/wash/:slug`) → gallery, services, hours, reviews render.
- [ ] Click **Book now** → pick service → date → slot → confirm → pay with Stripe test card
      `4242 4242 4242 4242`, any future expiry, any CVC.
- [ ] The Stripe webhook fires → booking flips to **confirmed / paid**, slot `booked_count` increments.
- [ ] `/booking/:id/success` shows the reference + QR code.

## 3. Tenant flow

- [ ] Log in as a tenant (`owner.a@washco.lk` / `Password123!` if seeded).
- [ ] `/tenant/dashboard` shows today's stats and the new booking (live toast if the customer
      just booked — Realtime).
- [ ] `/tenant/bookings` → Confirm → Start wash → upload before/after photos → Mark complete.
- [ ] `/tenant/services` → add, edit, disable a service.
- [ ] `/tenant/schedule` → generate slots, block/unblock a slot, edit operating hours.
- [ ] `/tenant/analytics` → revenue area chart + busiest-days bar chart render.
- [ ] `/tenant/payouts` → pending payout reflects the completed booking.

## 4. Review + notifications

- [ ] Back as the customer, the booking now shows **completed** (live status update).
- [ ] Click **Review**, submit a rating → tenant rating updates on the listing.
- [ ] The notification bell shows booking + review notifications.

## 5. Admin flow

- [ ] Log in as admin (`admin@washco.lk` / `Password123!`).
- [ ] `/admin` → platform stats, revenue chart, pending-approvals alert (live counter via Realtime).
- [ ] `/admin/tenants` → approve a pending tenant / feature an active one / suspend one.
- [ ] `/admin/bookings`, `/admin/users` (ban/unban), `/admin/revenue` (calculate + process payouts).

## Notes

- Cancelling a **paid** booking issues a Stripe refund and frees the slot.
- The webhook is the source of truth for payment → booking confirmation; the frontend
  `confirm` call is a best-effort fast-path and is idempotent with it.
