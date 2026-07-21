-- ============================================================
-- WashCo — Initial Schema Migration
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Enables Row Level Security on every user-facing table.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo-location search

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'tenant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE day_of_week AS ENUM ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- full_name / phone / role are read from the signup metadata (raw_user_meta_data).
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TENANTS (car wash businesses)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
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
  cancellation_policy TEXT NOT NULL DEFAULT 'flexible', -- flexible | moderate | strict
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
CREATE TABLE IF NOT EXISTS tenant_photos (
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
CREATE TABLE IF NOT EXISTS services (
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
CREATE TABLE IF NOT EXISTS operating_hours (
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
CREATE TABLE IF NOT EXISTS time_slots (
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
CREATE TABLE IF NOT EXISTS bookings (
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
CREATE SEQUENCE IF NOT EXISTS booking_seq START 1000;
CREATE OR REPLACE FUNCTION generate_booking_ref() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_ref IS NULL OR NEW.booking_ref = '' THEN
    NEW.booking_ref := 'WC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('booking_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_ref ON bookings;
CREATE TRIGGER set_booking_ref BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_ref();

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
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
    rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE tenant_id = NEW.tenant_id AND is_visible = TRUE), 0),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE tenant_id = NEW.tenant_id AND is_visible = TRUE)
  WHERE id = NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_review_change ON reviews;
CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tenant_rating();

-- ============================================================
-- TENANT SUBSCRIPTIONS (SaaS monthly fee)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
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
CREATE TABLE IF NOT EXISTS wash_passes (
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
CREATE TABLE IF NOT EXISTS notifications (
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
CREATE TABLE IF NOT EXISTS payouts (
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
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_city ON tenants(city);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_date ON time_slots(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payouts_tenant_id ON payouts(tenant_id);

-- ============================================================
-- updated_at helper trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','tenants','services','bookings','reviews','tenant_subscriptions']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%1$s_updated_at ON %1$s;', t);
    EXECUTE format('CREATE TRIGGER set_%1$s_updated_at BEFORE UPDATE ON %1$s FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_passes ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user an admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tenants: public can view active tenants; owners manage theirs; admins all
DROP POLICY IF EXISTS "Public can view active tenants" ON tenants;
CREATE POLICY "Public can view active tenants" ON tenants FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Owners can manage own tenant" ON tenants;
CREATE POLICY "Owners can manage own tenant" ON tenants FOR ALL USING (owner_id = auth.uid() OR is_admin());

-- Tenant photos: public read for active tenants; owners manage
DROP POLICY IF EXISTS "Public can view tenant photos" ON tenant_photos;
CREATE POLICY "Public can view tenant photos" ON tenant_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = tenant_photos.tenant_id AND (status = 'active' OR owner_id = auth.uid()))
);
DROP POLICY IF EXISTS "Owners manage tenant photos" ON tenant_photos;
CREATE POLICY "Owners manage tenant photos" ON tenant_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = tenant_photos.tenant_id AND owner_id = auth.uid())
);

-- Services: public can view services of active tenants; owners manage
DROP POLICY IF EXISTS "Public can view services" ON services;
CREATE POLICY "Public can view services" ON services FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = services.tenant_id AND (status = 'active' OR owner_id = auth.uid()))
);
DROP POLICY IF EXISTS "Tenant owners manage own services" ON services;
CREATE POLICY "Tenant owners manage own services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = services.tenant_id AND owner_id = auth.uid())
);

-- Operating hours: public read for active tenants; owners manage
DROP POLICY IF EXISTS "Public can view operating hours" ON operating_hours;
CREATE POLICY "Public can view operating hours" ON operating_hours FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Owners manage operating hours" ON operating_hours;
CREATE POLICY "Owners manage operating hours" ON operating_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = operating_hours.tenant_id AND owner_id = auth.uid())
);

-- Time slots: public read (for booking); owners manage
DROP POLICY IF EXISTS "Public can view time slots" ON time_slots;
CREATE POLICY "Public can view time slots" ON time_slots FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Owners manage time slots" ON time_slots;
CREATE POLICY "Owners manage time slots" ON time_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = time_slots.tenant_id AND owner_id = auth.uid())
);

-- Bookings: users see their own; tenants see bookings for their business; admins all
DROP POLICY IF EXISTS "Users see own bookings" ON bookings;
CREATE POLICY "Users see own bookings" ON bookings FOR SELECT USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Tenants see own bookings" ON bookings;
CREATE POLICY "Tenants see own bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = bookings.tenant_id AND owner_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reviews: public can read visible reviews; users write for completed bookings
DROP POLICY IF EXISTS "Public can read reviews" ON reviews;
CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (is_visible = TRUE OR user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Users can write reviews for completed bookings" ON reviews;
CREATE POLICY "Users can write reviews for completed bookings" ON reviews FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM bookings WHERE id = reviews.booking_id AND status = 'completed' AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can edit own reviews" ON reviews;
CREATE POLICY "Users can edit own reviews" ON reviews FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM tenants WHERE id = reviews.tenant_id AND owner_id = auth.uid())
);

-- Notifications: users see own notifications only
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Payouts: tenant owners view their own; admins all
DROP POLICY IF EXISTS "Owners view own payouts" ON payouts;
CREATE POLICY "Owners view own payouts" ON payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = payouts.tenant_id AND owner_id = auth.uid()) OR is_admin()
);

-- Tenant subscriptions: owners view own; admins all
DROP POLICY IF EXISTS "Owners view own subscription" ON tenant_subscriptions;
CREATE POLICY "Owners view own subscription" ON tenant_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants WHERE id = tenant_subscriptions.tenant_id AND owner_id = auth.uid()) OR is_admin()
);

-- Wash passes: users view own
DROP POLICY IF EXISTS "Users view own wash passes" ON wash_passes;
CREATE POLICY "Users view own wash passes" ON wash_passes FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- REALTIME (add tables to the supabase_realtime publication)
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
