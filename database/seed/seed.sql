-- ============================================================
-- WashCo — Seed Data (development / demo)
-- Run AFTER 001_initial_schema.sql, in the Supabase SQL Editor.
--
-- Creates demo auth users (admin, two tenant owners, one customer),
-- their profiles (via the handle_new_user trigger), car washes,
-- services, operating hours, and ~14 days of bookable time slots.
--
-- Demo login password for ALL seeded accounts: Password123!
-- ============================================================

-- pgcrypto provides crypt()/gen_salt() for the demo password hashes.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUIDs so the seed is idempotent and re-runnable.
-- admin:    11111111-1111-1111-1111-111111111111
-- owner A:  22222222-2222-2222-2222-222222222222
-- owner B:  33333333-3333-3333-3333-333333333333
-- customer: 44444444-4444-4444-4444-444444444444

-- ---------- Auth users ----------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'admin@washco.lk', crypt('Password123!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"WashCo Admin","phone":"+94770000001","role":"admin"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'owner.a@washco.lk', crypt('Password123!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Nimal Perera","phone":"+94770000002","role":"tenant"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'owner.b@washco.lk', crypt('Password123!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fathima Rizvi","phone":"+94770000003","role":"tenant"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
   'customer@washco.lk', crypt('Password123!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Kasun Silva","phone":"+94770000004","role":"user"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Identities (some GoTrue flows expect a matching identity row).
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@washco.lk"}', 'email', 'admin@washco.lk', NOW(), NOW(), NOW()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"owner.a@washco.lk"}', 'email', 'owner.a@washco.lk', NOW(), NOW(), NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"owner.b@washco.lk"}', 'email', 'owner.b@washco.lk', NOW(), NOW(), NOW()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"customer@washco.lk"}', 'email', 'customer@washco.lk', NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;

-- The handle_new_user trigger creates profiles automatically. Ensure roles
-- are correct even if profiles already existed before this seed ran.
UPDATE profiles SET role = 'admin'  WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET role = 'tenant' WHERE id IN ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');

-- ---------- Tenants (car washes) ----------
INSERT INTO tenants (id, owner_id, business_name, slug, description, address, city, district, lat, lng, phone, email, status, commission_rate, is_featured)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Speedy Wash Colombo 3', 'speedy-wash-col3',
   'Fast, friendly hand car wash in the heart of Colombo 3. Eco-friendly products, free vacuum with every wash.',
   '45 Duplication Road, Colombo 3', 'Colombo', 'Colombo 3', 6.90280000, 79.85280000,
   '+94112345601', 'hello@speedywash.lk', 'active', 16.00, TRUE),
  ('aaaaaaaa-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'AquaShine Auto Spa', 'aquashine-auto-spa',
   'Premium detailing and valet service. Ceramic coating, interior deep-clean, and paint protection specialists.',
   '120 Galle Road, Colombo 4', 'Colombo', 'Colombo 4', 6.88310000, 79.85650000,
   '+94112345602', 'book@aquashine.lk', 'active', 16.00, FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Rapid Rinse Nugegoda', 'rapid-rinse-nugegoda',
   'Affordable express washes near the Nugegoda junction. In and out in 20 minutes.',
   '8 High Level Road, Nugegoda', 'Colombo', 'Nugegoda', 6.86500000, 79.89890000,
   '+94112345603', 'info@rapidrinse.lk', 'pending', 16.00, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ---------- Services ----------
INSERT INTO services (id, tenant_id, name, description, price, duration_minutes, sort_order)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Basic Exterior Wash', 'Exterior wash, wheels, and dry-off.', 1500.00, 30, 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Wash & Vacuum', 'Exterior wash plus interior vacuum and dashboard wipe.', 2500.00, 45, 1),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Full Valet', 'Complete interior + exterior detail, tyre shine, and air freshener.', 5000.00, 90, 2),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'Express Shine', 'Quick exterior foam wash and hand dry.', 2000.00, 30, 0),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002', 'Interior Deep Clean', 'Seats, carpets, and upholstery shampoo.', 6500.00, 120, 1),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000002', 'Ceramic Coating', 'Long-lasting ceramic paint protection.', 25000.00, 180, 2)
ON CONFLICT (id) DO NOTHING;

-- ---------- Operating hours (Mon–Sat 08:00–18:00, Sun closed) ----------
INSERT INTO operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
SELECT t.id, d.day::day_of_week, '08:00', '18:00', (d.day = 'sunday')
FROM (SELECT unnest(ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday']) AS day) d
CROSS JOIN (SELECT id FROM tenants WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002')) t
ON CONFLICT (tenant_id, day_of_week) DO NOTHING;

-- ---------- Time slots: next 14 days, 08:00–18:00, 30-min slots, skip Sundays ----------
INSERT INTO time_slots (tenant_id, date, start_time, end_time, capacity)
SELECT
  t.id,
  d::date,
  (t0)::time,
  (t0 + INTERVAL '30 minutes')::time,
  2
FROM (SELECT id FROM tenants WHERE id IN ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000002')) t
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '13 days', INTERVAL '1 day') d
CROSS JOIN generate_series(
  (d::date + TIME '08:00'),
  (d::date + TIME '17:30'),
  INTERVAL '30 minutes'
) AS t0
WHERE EXTRACT(DOW FROM d) <> 0  -- 0 = Sunday
ON CONFLICT (tenant_id, date, start_time) DO NOTHING;

-- ---------- Tenant subscriptions ----------
INSERT INTO tenant_subscriptions (tenant_id, plan, monthly_fee, status, current_period_start, current_period_end)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'premium', 9900.00, 'active', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'basic', 4900.00, 'active', date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month')
ON CONFLICT DO NOTHING;

-- Done. Demo accounts (password Password123!):
--   admin@washco.lk (admin) · owner.a@washco.lk & owner.b@washco.lk (tenants) · customer@washco.lk (user)
