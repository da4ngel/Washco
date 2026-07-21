# WashCo — Master Build Prompt
### Production-Ready Car Wash Marketplace
### Stack: React · Node.js · Express · Supabase

---

## ROLE & OBJECTIVE

You are building **WashCo** — a production-ready two-sided marketplace that connects car wash businesses (tenants) with customers (users) in Colombo, Sri Lanka.

Think of it as the Airbnb for car washes: users browse, book, and pay through the app; car wash owners manage their bookings and earnings from a tenant dashboard. WashCo earns a commission on every booking plus a monthly SaaS fee from tenants.

Build the **entire full-stack application** from scratch. Do not use placeholder data, mock APIs, or TODO comments. Every feature listed must be fully implemented and functional.

---

## TECH STACK (STRICT — do not deviate)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State management | Zustand |
| Data fetching | TanStack Query (React Query v5) |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Backend | Node.js + Express (TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + phone OTP) |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime (live booking updates) |
| Payments | Stripe (card payments) |
| Validation | Zod (backend + frontend shared schemas) |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan + Winston |
| Environment | dotenv |

---

## PROJECT FOLDER STRUCTURE

Generate the project as a monorepo with this exact structure:

```
washco/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── TenantLayout.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── booking/
│   │   │   │   ├── BookingCard.tsx
│   │   │   │   ├── TimeSlotPicker.tsx
│   │   │   │   ├── ServiceSelector.tsx
│   │   │   │   └── BookingStatusBadge.tsx
│   │   │   ├── tenant/
│   │   │   │   ├── TenantCard.tsx
│   │   │   │   ├── TenantGallery.tsx
│   │   │   │   ├── ReviewCard.tsx
│   │   │   │   └── RatingStars.tsx
│   │   │   ├── maps/
│   │   │   │   └── TenantMap.tsx
│   │   │   └── shared/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── pages/
│   │   │   ├── user/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── SearchPage.tsx
│   │   │   │   ├── TenantDetailPage.tsx
│   │   │   │   ├── BookingPage.tsx
│   │   │   │   ├── BookingSuccessPage.tsx
│   │   │   │   ├── UserDashboardPage.tsx
│   │   │   │   └── ProfilePage.tsx
│   │   │   ├── tenant/
│   │   │   │   ├── TenantDashboardPage.tsx
│   │   │   │   ├── BookingsPage.tsx
│   │   │   │   ├── ServicesPage.tsx
│   │   │   │   ├── SchedulePage.tsx
│   │   │   │   ├── AnalyticsPage.tsx
│   │   │   │   ├── PayoutsPage.tsx
│   │   │   │   └── TenantSettingsPage.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboardPage.tsx
│   │   │   │   ├── TenantApprovalsPage.tsx
│   │   │   │   ├── AllBookingsPage.tsx
│   │   │   │   ├── RevenuePage.tsx
│   │   │   │   └── UsersPage.tsx
│   │   │   └── auth/
│   │   │       ├── LoginPage.tsx
│   │   │       ├── RegisterPage.tsx
│   │   │       ├── TenantRegisterPage.tsx
│   │   │       └── ForgotPasswordPage.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useTenants.ts
│   │   │   ├── useTimeSlots.ts
│   │   │   └── useReviews.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── bookingStore.ts
│   │   ├── services/
│   │   │   ├── api.ts              # Axios instance with interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── tenant.service.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── review.service.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── stripe.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── schemas/               # Shared Zod schemas
│   │   │   ├── auth.schema.ts
│   │   │   ├── booking.schema.ts
│   │   │   └── tenant.schema.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── tenant.routes.ts
│   │   │   ├── booking.routes.ts
│   │   │   ├── service.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── review.routes.ts
│   │   │   ├── slot.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── tenant.controller.ts
│   │   │   ├── booking.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts    # Verify Supabase JWT
│   │   │   ├── authorize.ts       # Role-based access (user/tenant/admin)
│   │   │   ├── validate.ts        # Zod request validation
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   ├── booking.service.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── slot.service.ts
│   │   ├── config/
│   │   │   ├── supabase.ts        # Service role client
│   │   │   ├── stripe.ts
│   │   │   └── logger.ts
│   │   ├── utils/
│   │   │   ├── errors.ts          # Custom error classes
│   │   │   └── helpers.ts
│   │   └── index.ts               # Express app entry point
│   ├── tsconfig.json
│   └── package.json
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       └── seed.sql
│
├── .env.example
└── package.json                   # Root scripts
```

---

## DATABASE SCHEMA (Supabase PostgreSQL)

Run this SQL exactly in Supabase SQL Editor. Enable Row Level Security on every table.

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo-location search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'tenant', 'admin');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE day_of_week AS ENUM ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TENANTS (car wash businesses)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,          -- URL-friendly name e.g. "speedy-wash-col3"
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Colombo',
  district TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  phone TEXT NOT NULL,
  email TEXT,
  status tenant_status NOT NULL DEFAULT 'pending',
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 16.00,  -- percentage WashCo takes
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TENANT PHOTOS
-- ============================================================
CREATE TABLE tenant_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICES (offered by each tenant)
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- e.g. "Basic Exterior Wash"
  description TEXT,
  price DECIMAL(10,2) NOT NULL,        -- in LKR
  duration_minutes INTEGER NOT NULL,   -- how long the service takes
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OPERATING HOURS
-- ============================================================
CREATE TABLE operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE(tenant_id, day_of_week)
);

-- ============================================================
-- TIME SLOTS (generated or manually created)
-- ============================================================
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  booked_count INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,    -- tenant can block slots manually
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, date, start_time)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref TEXT UNIQUE NOT NULL,    -- human-readable: WC-2024-00001
  user_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  service_id UUID NOT NULL REFERENCES services(id),
  slot_id UUID NOT NULL REFERENCES time_slots(id),
  status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  -- Pricing snapshot (stored at booking time so price changes don't break history)
  service_price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  tenant_payout DECIMAL(10,2) NOT NULL,
  -- Photos (before/after for quality assurance)
  before_photo_url TEXT,
  after_photo_url TEXT,
  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  -- Metadata
  user_notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-increment booking reference
CREATE SEQUENCE booking_seq START 1000;
CREATE OR REPLACE FUNCTION generate_booking_ref() RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_ref := 'WC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('booking_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_ref BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tenant_reply TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update tenant rating when a review is inserted/updated
CREATE OR REPLACE FUNCTION update_tenant_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenants SET
    rating = (SELECT AVG(rating) FROM reviews WHERE tenant_id = NEW.tenant_id AND is_visible = TRUE),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE tenant_id = NEW.tenant_id AND is_visible = TRUE)
  WHERE id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tenant_rating();

-- ============================================================
-- TENANT SUBSCRIPTIONS (SaaS monthly fee)
-- ============================================================
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'basic',  -- basic | premium
  monthly_fee DECIMAL(10,2) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER WASH PASSES (subscription for users)
-- ============================================================
CREATE TABLE wash_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan_name TEXT NOT NULL,           -- e.g. "Wash Pass - 4 Washes"
  total_washes INTEGER NOT NULL,
  used_washes INTEGER NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- booking_confirmed | booking_reminder | booking_completed | payout_sent
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYOUTS (tenant earnings tracking)
-- ============================================================
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed
  payment_reference TEXT,
  booking_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_city ON tenants(city);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_time_slots_tenant_date ON time_slots(tenant_id, date);
CREATE INDEX idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile; admins see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tenants: public can view active tenants; owners manage theirs
CREATE POLICY "Public can view active tenants" ON tenants FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can manage own tenant" ON tenants FOR ALL USING (owner_id = auth.uid());

-- Services: public can view services of active tenants
CREATE POLICY "Public can view services" ON services FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = services.tenant_id AND status = 'active')
);
CREATE POLICY "Tenant owners manage own services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = services.tenant_id AND owner_id = auth.uid())
);

-- Bookings: users see their own; tenants see bookings for their business
CREATE POLICY "Users see own bookings" ON bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tenants see own bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = bookings.tenant_id AND owner_id = auth.uid())
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reviews: public can read visible reviews
CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Users can write reviews for completed bookings" ON reviews FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM bookings WHERE id = reviews.booking_id AND status = 'completed' AND user_id = auth.uid())
);

-- Notifications: users see own notifications only
CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (user_id = auth.uid());
```

---

## BACKEND API — ALL ENDPOINTS

Base URL: `http://localhost:4000/api`

### Auth Routes (`/api/auth`)
```
POST   /register              Register new user (name, email, password, phone)
POST   /register/tenant       Register as a tenant (business info + owner info)
POST   /login                 Login with email + password
POST   /logout                Invalidate session
POST   /refresh               Refresh access token
POST   /forgot-password       Send password reset email
POST   /reset-password        Reset password with token
GET    /me                    Get current authenticated user with profile
```

### User Routes (`/api/users`) — requires auth
```
GET    /profile               Get current user profile
PUT    /profile               Update name, phone, avatar
GET    /bookings              Paginated booking history with filters
GET    /bookings/:id          Single booking detail
GET    /notifications         Paginated notifications
PUT    /notifications/:id/read  Mark notification as read
PUT    /notifications/read-all  Mark all as read
GET    /wash-passes           Get user's active wash passes
```

### Tenant Routes (`/api/tenants`)
```
GET    /                      Search tenants (query, lat, lng, radius, rating, service_type)
GET    /:id                   Public tenant profile with services and reviews
GET    /:id/services          List of services offered
GET    /:id/availability      Available time slots for a date range
GET    /:id/reviews           Paginated reviews with rating breakdown

-- Protected: tenant owner only
GET    /dashboard             Tenant's own dashboard data
PUT    /profile               Update business info, hours, photos
POST   /photos                Upload photos to Supabase Storage
DELETE /photos/:photoId       Delete a photo
PUT    /photos/:photoId/primary  Set as primary photo
```

### Service Routes (`/api/services`) — tenant-auth required
```
POST   /                      Create a service
PUT    /:id                   Update a service
DELETE /:id                   Soft-delete a service (set is_active = false)
PUT    /:id/reorder           Update sort_order
```

### Slot Routes (`/api/slots`) — tenant-auth required
```
GET    /tenant/:tenantId      Get slots for a date range (public, for booking)
POST   /generate              Auto-generate slots for a week based on operating hours
PUT    /:id/block             Block a slot (tenant blocks their own availability)
PUT    /:id/unblock           Unblock a slot
POST   /bulk-block            Block multiple slots at once (holiday, day off)
```

### Booking Routes (`/api/bookings`)
```
POST   /                      Create a booking (user → selects tenant, service, slot)
GET    /:id                   Get booking details
POST   /:id/cancel            Cancel a booking (user or tenant)
PUT    /:id/confirm           Tenant confirms a booking
PUT    /:id/start             Tenant marks booking as in_progress
PUT    /:id/complete          Tenant marks booking as completed
POST   /:id/photos            Upload before/after photos (tenant)
GET    /tenant/all            All bookings for the authenticated tenant (paginated)
```

### Payment Routes (`/api/payments`)
```
POST   /create-intent         Create Stripe PaymentIntent, returns client_secret
POST   /confirm               Confirm payment after Stripe frontend confirms
POST   /webhook               Stripe webhook endpoint (use raw body parser here)
POST   /refund/:bookingId     Admin-only refund
```

### Review Routes (`/api/reviews`)
```
POST   /                      Create a review (only for completed bookings)
PUT    /:id                   Edit own review
DELETE /:id                   Delete own review
PUT    /:id/reply             Tenant replies to a review
```

### Admin Routes (`/api/admin`) — admin-auth required
```
GET    /dashboard             Platform-wide stats (bookings, revenue, users, tenants)
GET    /tenants               All tenants with filters (status, date range)
GET    /tenants/:id           Full tenant detail view
PUT    /tenants/:id/approve   Approve a pending tenant
PUT    /tenants/:id/suspend   Suspend an active tenant
PUT    /tenants/:id/reject    Reject a pending tenant
PUT    /tenants/:id/featured  Toggle featured status
GET    /bookings              All bookings across platform
GET    /users                 All user accounts
PUT    /users/:id/ban         Ban a user account
GET    /revenue               Revenue reports by day/week/month
POST   /payouts/calculate     Calculate pending payouts for tenants
POST   /payouts/process       Mark payouts as processed
```

---

## FRONTEND PAGES — FULL FEATURE REQUIREMENTS

### User-Facing Pages

**HomePage (`/`)**
- Hero section with search bar (location-based or text search)
- "Top-rated in Colombo" horizontal scroll of TenantCards
- Featured car washes (with badge)
- How it works section (3 steps: Search → Book → Arrive)
- Download app CTA banner

**SearchPage (`/search`)**
- Search input + filters sidebar:
  - Distance (1km / 3km / 5km / 10km)
  - Minimum rating (3★ / 4★ / 4.5★)
  - Price range slider (LKR)
  - Available today toggle
- Results grid of TenantCards
- Map view toggle (show tenants on a map)
- Pagination / infinite scroll

**TenantDetailPage (`/wash/:slug`)**
- Photo gallery (primary photo + thumbnail strip)
- Business name, rating, review count, address, distance from user
- Services list with prices and duration
- "Book Now" button → opens date picker
- Operating hours
- Customer reviews with rating breakdown (5★ 4★ breakdown bar)
- Map embed showing location

**BookingPage (`/book/:tenantId`)**
- Step-by-step flow:
  - Step 1: Select a service
  - Step 2: Pick a date (calendar, blocked dates greyed out)
  - Step 3: Pick a time slot (show available slots as buttons)
  - Step 4: Confirm details + add notes
  - Step 5: Pay with card (Stripe Elements)
- Show price breakdown: Service price, Platform fee (shown as "Processing fee"), Total

**BookingSuccessPage (`/booking/:id/success`)**
- Booking reference (WC-2024-00001)
- Summary of what was booked
- QR code with booking ID (for tenant to scan)
- Add to calendar button
- "View my bookings" CTA

**UserDashboardPage (`/dashboard`)**
- Upcoming bookings with status badges and action buttons
- Past bookings with "Review" CTA for completed ones
- Wash Pass status card (if active)
- Quick stats (total washes, money spent, favorite car wash)

**ProfilePage (`/profile`)**
- Edit name, phone, avatar
- Change password
- Notification preferences
- Wash Pass purchase/management

---

### Tenant Dashboard Pages

**TenantDashboardPage (`/tenant/dashboard`)**
- Today's stats: bookings today, earnings today, next booking countdown
- Quick actions: View schedule, Add service, View payouts
- Recent bookings list
- Rating summary card
- Week-at-a-glance calendar mini view

**BookingsPage (`/tenant/bookings`)**
- Tabs: Upcoming / Today / Completed / Cancelled
- Each booking card shows: user name, service, time, price, status
- Action buttons: Confirm, Mark In Progress, Mark Complete, Cancel
- Photo upload button (before/after) on in-progress bookings

**ServicesPage (`/tenant/services`)**
- List of all services with drag-to-reorder
- Add new service form (name, description, price, duration)
- Toggle active/inactive
- Edit and delete actions

**SchedulePage (`/tenant/schedule`)**
- Weekly calendar view of time slots
- Green = available, Orange = booked, Grey = blocked
- Click a slot to block/unblock
- "Generate next week's slots" button
- Set operating hours (opens modal)

**AnalyticsPage (`/tenant/analytics`)**
- Revenue chart (last 30 days, bar chart)
- Total bookings, completion rate, cancellation rate
- Top service by bookings
- Rating trend over time (line chart)
- Busiest day of week (heatmap)
- Repeat customer rate

**PayoutsPage (`/tenant/payouts`)**
- Current period earnings (pending payout)
- Payout history table (date, amount, status)
- Commission breakdown explanation

---

### Admin Pages

**AdminDashboardPage (`/admin`)**
- Platform stats: Total users, active tenants, bookings today, MRR
- Revenue chart (daily for last 30 days)
- Pending tenant approvals alert card
- Recent bookings feed

**TenantApprovalsPage (`/admin/tenants`)**
- Table of pending tenants with: business name, owner, location, date applied
- Preview panel (click row): shows full details
- Approve / Reject buttons with reason input for rejection
- Suspension management for active tenants

---

## KEY BUSINESS LOGIC

### Booking Flow (critical — implement exactly)
1. User selects service → system calculates end time based on `duration_minutes`
2. System checks `time_slots` table for available slots that fit the duration
3. `time_slots.booked_count < time_slots.capacity` = available
4. On booking creation:
   - Calculate `platform_fee = service_price * (commission_rate / 100)`
   - Calculate `tenant_payout = service_price - platform_fee`
   - Create Stripe PaymentIntent for `service_price`
   - Set booking status to `pending`, payment_status to `unpaid`
5. On Stripe webhook `payment_intent.succeeded`:
   - Update `bookings.payment_status = 'paid'`
   - Update `bookings.status = 'confirmed'`
   - Increment `time_slots.booked_count`
   - Send notification to user (booking confirmed)
   - Send notification to tenant (new booking)
6. On booking completion:
   - Tenant marks complete
   - System adds to pending payout for tenant
   - System prompts user to leave a review

### Slot Generation Logic
When a tenant sets operating hours, auto-generate time slots for the next 30 days:
- Split each day into slots based on the shortest service duration (default: 30 min)
- Each slot gets capacity = 1 by default (can be increased)
- Do not generate slots for days marked as `is_closed = true`
- Re-generate when operating hours change (delete future unbooked slots, regenerate)

### Commission Calculation
- Default commission: 16% (configurable per tenant in the `tenants` table)
- `platform_fee = ROUND(service_price * commission_rate / 100, 2)`
- `tenant_payout = service_price - platform_fee`
- Store both values at booking time (never recalculate from live rates)

### Tenant Status Flow
```
pending → active (admin approves)
pending → rejected (admin rejects, email sent with reason)
active  → suspended (admin action, tenant can appeal)
suspended → active (admin reinstates)
```

### Cancellation Policy
- User cancels 2+ hours before: full refund via Stripe
- User cancels under 2 hours: no refund (or partial, configurable)
- Tenant cancels: always full refund to user, flag tenant account
- Implement as a `cancellation_policy` field on tenants (selectable preset)

---

## ENVIRONMENT VARIABLES

Create `.env.example` with all these variables (no default values for secrets):

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Backend
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=                          # same as Supabase JWT secret

# Frontend (Vite prefix)
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

---

## SECURITY REQUIREMENTS (all must be implemented)

```typescript
// backend/src/index.ts — required middleware stack in order:

import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import express from 'express'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))

// Stripe webhook needs raw body — mount BEFORE json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))

app.use(morgan('combined'))

// General rate limit
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// Strict rate limit on auth endpoints
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }))
```

### Authentication Middleware
```typescript
// backend/src/middleware/authenticate.ts
import { createClient } from '@supabase/supabase-js'

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Invalid token' })

  // Fetch full profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  req.user = { ...user, profile }
  next()
}

export const requireRole = (role: string | string[]) => {
  return (req, res, next) => {
    const roles = Array.isArray(role) ? role : [role]
    if (!roles.includes(req.user?.profile?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
```

### Input Validation with Zod
```typescript
// All request bodies must be validated. Example:
import { z } from 'zod'

export const createBookingSchema = z.object({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  user_notes: z.string().max(500).optional()
})

export const validate = (schema: z.ZodSchema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten()
      })
    }
    req.body = result.data
    next()
  }
}
```

---

## SUPABASE STORAGE BUCKETS

Create these buckets in Supabase Storage:

```
tenant-photos/     — public bucket, max 5MB per file, images only
booking-photos/    — private bucket, accessible via signed URLs, max 10MB
avatars/           — public bucket, max 2MB per file
```

File naming convention:
- `tenant-photos/{tenantId}/{uuid}.jpg`
- `booking-photos/{bookingId}/before.jpg` and `after.jpg`
- `avatars/{userId}/avatar.jpg`

---

## REALTIME FEATURES (Supabase Realtime)

Implement live updates on these events using Supabase Realtime channels:

1. **Tenant dashboard** — live update when a new booking comes in
   - Subscribe to `bookings` table INSERT where `tenant_id = {currentTenant}`
   - Show a toast notification and update the bookings list instantly

2. **User booking status** — live update when tenant changes booking status
   - Subscribe to `bookings` table UPDATE where `id = {bookingId}` and `user_id = {currentUser}`
   - Update booking status badge in real time on the dashboard

3. **Admin dashboard** — live platform stats
   - Subscribe to bookings INSERT to increment live counter

---

## FRONTEND STATE MANAGEMENT

### Auth Store (Zustand)
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}
```

### Booking Store (Zustand)
```typescript
// src/store/bookingStore.ts
// Holds the in-progress booking state across the multi-step booking flow
interface BookingState {
  selectedTenant: Tenant | null
  selectedService: Service | null
  selectedDate: string | null
  selectedSlot: TimeSlot | null
  setTenant: (tenant: Tenant) => void
  setService: (service: Service) => void
  setDate: (date: string) => void
  setSlot: (slot: TimeSlot) => void
  reset: () => void
}
```

---

## UI/UX REQUIREMENTS

- **Color scheme**: Deep navy (`#0F2167`) as primary, lime green (`#4ADE80`) as accent, clean white backgrounds
- **Mobile-first**: All pages must be fully responsive. The user-facing app is primarily used on mobile.
- **Loading states**: Every data-fetching component must have a skeleton loader (not a spinner)
- **Error states**: Every component must handle API errors gracefully with an EmptyState or error card
- **Toast notifications**: Use `sonner` library for all success/error toasts
- **Booking status badges**: Use distinct colors — pending=yellow, confirmed=blue, in_progress=orange, completed=green, cancelled=red

---

## WHAT NOT TO DO

- Do NOT use any mock data or hardcoded arrays anywhere in the final code
- Do NOT use `console.log` in production code — use the Winston logger
- Do NOT store sensitive data in localStorage — use Supabase session only
- Do NOT skip input validation on ANY backend route
- Do NOT expose the Supabase service role key to the frontend ever
- Do NOT use `any` TypeScript types — be explicit throughout
- Do NOT skip error handling — every async function must have try/catch

---

## OUTPUT EXPECTED

Generate the complete, production-ready codebase with:
1. All files in the folder structure listed above
2. Working backend Express server with all routes implemented
3. Working React frontend with all pages implemented
4. The SQL migration file ready to run in Supabase
5. A `README.md` with setup instructions (install, env setup, DB migration, run)
6. Both `package.json` files (frontend and backend) with all dependencies listed

Start with the database schema, then the backend, then the frontend.
Do not stop until every route, every page, and every component is complete.
```

---

*Generated for WashCo — Car Wash Marketplace Platform*
*Stack: React 18 · Node.js · Express · Supabase · Stripe*
