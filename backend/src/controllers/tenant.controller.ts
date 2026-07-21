import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, parsePagination } from '../utils/helpers';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { clearFutureUnbookedSlots, generateSlots } from '../services/slot.service';
import { SearchTenantsQuery } from '../schemas/tenant.schema';
import { Tenant, Service, TimeSlot, Booking, DayOfWeek } from '../types';

/** Haversine distance in km between two lat/lng points. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type TenantWithExtras = Tenant & {
  photos: { url: string; is_primary: boolean }[];
  services: { price: number }[];
  starting_price: number | null;
  distance_km?: number;
};

/** GET /api/tenants — public search with filters. */
export const searchTenants = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as SearchTenantsQuery;
  const { from, to } = parsePagination({ page: q.page, limit: q.limit });

  let query = supabaseAdmin
    .from('tenants')
    .select(
      '*, photos:tenant_photos(url,is_primary), services:services(price)',
      { count: 'exact' }
    )
    .eq('status', 'active');

  if (q.q) query = query.ilike('business_name', `%${q.q}%`);
  if (q.city) query = query.eq('city', q.city);
  if (q.district) query = query.eq('district', q.district);
  if (q.min_rating) query = query.gte('rating', q.min_rating);

  // Sorting (distance sort is applied in JS after fetch).
  if (q.sort === 'newest') query = query.order('created_at', { ascending: false });
  else query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  let results: TenantWithExtras[] = (data ?? []).map((t) => {
    const services = (t.services ?? []) as { price: number }[];
    const starting = services.length ? Math.min(...services.map((s) => Number(s.price))) : null;
    const tenant = t as unknown as TenantWithExtras;
    return { ...tenant, starting_price: starting };
  });

  // Max price filter (based on starting price).
  if (q.max_price !== undefined) {
    results = results.filter((t) => t.starting_price !== null && t.starting_price <= q.max_price!);
  }

  // Distance annotation + optional radius filter + distance sort.
  if (q.lat !== undefined && q.lng !== undefined) {
    results = results.map((t) => ({
      ...t,
      distance_km:
        t.lat !== null && t.lng !== null
          ? Number(distanceKm(q.lat!, q.lng!, Number(t.lat), Number(t.lng)).toFixed(2))
          : undefined,
    }));
    if (q.radius !== undefined) {
      results = results.filter((t) => t.distance_km !== undefined && t.distance_km <= q.radius!);
    }
    if (q.sort === 'distance') {
      results.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }
  }

  res.json({
    data: results,
    page: q.page,
    limit: q.limit,
    total: count ?? results.length,
    totalPages: Math.ceil((count ?? results.length) / q.limit),
  });
});

/** Resolves a tenant by UUID or slug. */
async function findTenant(idOrSlug: string): Promise<Tenant | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const column = isUuid ? 'id' : 'slug';
  const { data } = await supabaseAdmin.from('tenants').select('*').eq(column, idOrSlug).maybeSingle<Tenant>();
  return data;
}

/** GET /api/tenants/:id — public tenant profile with photos, services, hours, recent reviews. */
export const getTenant = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await findTenant(req.params.id);
  if (!tenant || tenant.status !== 'active') throw new NotFoundError('Car wash not found.');

  const [photos, services, hours, reviews] = await Promise.all([
    supabaseAdmin.from('tenant_photos').select('*').eq('tenant_id', tenant.id).order('sort_order'),
    supabaseAdmin
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabaseAdmin.from('operating_hours').select('*').eq('tenant_id', tenant.id),
    supabaseAdmin
      .from('reviews')
      .select('*, user:profiles(full_name,avatar_url)')
      .eq('tenant_id', tenant.id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  res.json({
    ...tenant,
    photos: photos.data ?? [],
    services: services.data ?? [],
    operating_hours: hours.data ?? [],
    recent_reviews: reviews.data ?? [],
  });
});

/** GET /api/tenants/:id/services */
export const getTenantServices = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await findTenant(req.params.id);
  if (!tenant) throw new NotFoundError('Car wash not found.');
  const { data } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order');
  res.json({ data: (data ?? []) as Service[] });
});

/** GET /api/tenants/:id/availability?from&to&service_id — bookable slots. */
export const getTenantAvailability = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await findTenant(req.params.id);
  if (!tenant) throw new NotFoundError('Car wash not found.');

  const from = (req.query.from as string) ?? new Date().toISOString().slice(0, 10);
  const to =
    (req.query.to as string) ??
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('time_slots')
    .select('*')
    .eq('tenant_id', tenant.id)
    .gte('date', from)
    .lte('date', to)
    .order('date')
    .order('start_time');
  if (error) throw error;

  const now = Date.now();
  const slots = (data ?? []).map((s: TimeSlot) => ({
    ...s,
    available:
      !s.is_blocked &&
      s.booked_count < s.capacity &&
      new Date(`${s.date}T${s.start_time}`).getTime() > now,
  }));

  res.json({ data: slots });
});

/** GET /api/tenants/:id/reviews — paginated with rating breakdown. */
export const getTenantReviews = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await findTenant(req.params.id);
  if (!tenant) throw new NotFoundError('Car wash not found.');

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabaseAdmin
    .from('reviews')
    .select('*, user:profiles(full_name,avatar_url)', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  // Rating breakdown (counts per star).
  const { data: allRatings } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('tenant_id', tenant.id)
    .eq('is_visible', true);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
  for (const r of allRatings ?? []) breakdown[(r as { rating: number }).rating] += 1;

  res.json({
    data: data ?? [],
    breakdown,
    average: Number(tenant.rating),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
});

// ============================================================
// Tenant-owner (protected) endpoints
// ============================================================

/** Loads the tenant owned by the authenticated user. */
async function getOwnedTenant(userId: string): Promise<Tenant> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle<Tenant>();
  if (!data) throw new NotFoundError('No business found for this account.');
  return data;
}

/** GET /api/tenants/me — the owner's own tenant (any status) with relations. */
export const getMyTenant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);
  const [photos, services, hours] = await Promise.all([
    supabaseAdmin.from('tenant_photos').select('*').eq('tenant_id', tenant.id).order('sort_order'),
    supabaseAdmin.from('services').select('*').eq('tenant_id', tenant.id).order('sort_order'),
    supabaseAdmin.from('operating_hours').select('*').eq('tenant_id', tenant.id),
  ]);
  res.json({
    ...tenant,
    photos: photos.data ?? [],
    services: services.data ?? [],
    operating_hours: hours.data ?? [],
  });
});

/** GET /api/tenants/dashboard — owner dashboard summary. */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);

  const { data: bookingsRaw } = await supabaseAdmin
    .from('bookings')
    .select('*, service:services(name), slot:time_slots(date,start_time), user:profiles(full_name,avatar_url)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const bookings = (bookingsRaw ?? []) as (Booking & { slot?: { date: string; start_time: string } })[];

  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const todays = bookings.filter((b) => b.slot?.date === today && b.status !== 'cancelled');
  const earningsToday = todays
    .filter((b) => ['confirmed', 'in_progress', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.tenant_payout), 0);

  const upcoming = bookings
    .filter(
      (b) =>
        ['confirmed', 'pending'].includes(b.status) &&
        b.slot &&
        new Date(`${b.slot.date}T${b.slot.start_time}`).getTime() > now
    )
    .sort(
      (a, b) =>
        new Date(`${a.slot!.date}T${a.slot!.start_time}`).getTime() -
        new Date(`${b.slot!.date}T${b.slot!.start_time}`).getTime()
    );

  const pendingPayout = bookings
    .filter((b) => b.status === 'completed' && b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.tenant_payout), 0);

  res.json({
    tenant,
    stats: {
      bookings_today: todays.length,
      earnings_today: earningsToday,
      pending_payout: pendingPayout,
      total_bookings: tenant.total_bookings,
      rating: Number(tenant.rating),
      total_reviews: tenant.total_reviews,
    },
    next_booking: upcoming[0] ?? null,
    recent_bookings: bookings.slice(0, 8),
  });
});

/** PUT /api/tenants/profile — update business info. */
export const updateMyTenant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update(req.body)
    .eq('id', tenant.id)
    .select('*')
    .single<Tenant>();
  if (error) throw new BadRequestError(error.message);
  res.json({ tenant: data });
});

/** PUT /api/tenants/hours — replace operating hours, then regenerate slots. */
export const updateOperatingHours = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);

  const hours = (req.body.hours ?? []) as {
    day_of_week: DayOfWeek;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }[];

  for (const h of hours) {
    await supabaseAdmin
      .from('operating_hours')
      .upsert({ tenant_id: tenant.id, ...h }, { onConflict: 'tenant_id,day_of_week' });
  }

  // Regenerate future unbooked slots to match the new hours.
  await clearFutureUnbookedSlots(tenant.id);
  await generateSlots({ tenantId: tenant.id, days: 30, capacity: 1 });

  const { data } = await supabaseAdmin.from('operating_hours').select('*').eq('tenant_id', tenant.id);
  res.json({ operating_hours: data ?? [] });
});

/** POST /api/tenants/photos — record an uploaded photo URL. */
export const addPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);
  const { url, caption, is_primary } = req.body as { url: string; caption?: string; is_primary?: boolean };

  if (is_primary) {
    await supabaseAdmin.from('tenant_photos').update({ is_primary: false }).eq('tenant_id', tenant.id);
  }

  const { data, error } = await supabaseAdmin
    .from('tenant_photos')
    .insert({ tenant_id: tenant.id, url, caption: caption ?? null, is_primary: is_primary ?? false })
    .select('*')
    .single();
  if (error) throw new BadRequestError(error.message);
  res.status(201).json({ photo: data });
});

/** DELETE /api/tenants/photos/:photoId */
export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);
  const { data: photo } = await supabaseAdmin
    .from('tenant_photos')
    .select('id,tenant_id')
    .eq('id', req.params.photoId)
    .single<{ id: string; tenant_id: string }>();
  if (!photo) throw new NotFoundError('Photo not found.');
  if (photo.tenant_id !== tenant.id) throw new ForbiddenError();

  const { error } = await supabaseAdmin.from('tenant_photos').delete().eq('id', req.params.photoId);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Photo deleted.' });
});

/** PUT /api/tenants/photos/:photoId/primary */
export const setPrimaryPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);
  await supabaseAdmin.from('tenant_photos').update({ is_primary: false }).eq('tenant_id', tenant.id);
  const { error } = await supabaseAdmin
    .from('tenant_photos')
    .update({ is_primary: true })
    .eq('id', req.params.photoId)
    .eq('tenant_id', tenant.id);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Primary photo updated.' });
});

/** GET /api/tenants/payouts — pending + history for the owner. */
export const getPayouts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);

  const { data: completed } = await supabaseAdmin
    .from('bookings')
    .select('tenant_payout, platform_fee, service_price')
    .eq('tenant_id', tenant.id)
    .eq('status', 'completed')
    .eq('payment_status', 'paid');

  const pending = (completed ?? []).reduce((sum, b) => sum + Number(b.tenant_payout), 0);
  const grossEarnings = (completed ?? []).reduce((sum, b) => sum + Number(b.service_price), 0);
  const totalCommission = (completed ?? []).reduce((sum, b) => sum + Number(b.platform_fee), 0);

  const { data: history } = await supabaseAdmin
    .from('payouts')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false });

  res.json({
    pending_amount: pending,
    gross_earnings: grossEarnings,
    total_commission: totalCommission,
    commission_rate: Number(tenant.commission_rate),
    completed_count: completed?.length ?? 0,
    history: history ?? [],
  });
});

/** GET /api/tenants/analytics — owner analytics (revenue, rates, top service…). */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenant = await getOwnedTenant(req.user.id);

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: bookingsRaw } = await supabaseAdmin
    .from('bookings')
    .select('id,user_id,status,payment_status,tenant_payout,created_at,service:services(name),slot:time_slots(date)')
    .eq('tenant_id', tenant.id)
    .gte('created_at', since);

  const bookings = (bookingsRaw ?? []) as unknown as (Booking & {
    service?: { name: string };
    slot?: { date: string };
  })[];

  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  // Daily revenue (tenant payout of paid bookings).
  const revByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    revByDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    if (b.payment_status === 'paid') {
      const d = b.created_at.slice(0, 10);
      if (revByDay.has(d)) revByDay.set(d, (revByDay.get(d) ?? 0) + Number(b.tenant_payout));
    }
  }

  // Top service by bookings.
  const serviceCounts = new Map<string, number>();
  for (const b of bookings) {
    const name = b.service?.name ?? 'Unknown';
    serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
  }
  const topService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  // Busiest day of week (0=Sun..6=Sat) based on slot date.
  const dow = [0, 0, 0, 0, 0, 0, 0];
  for (const b of bookings) {
    if (b.slot?.date) dow[new Date(b.slot.date).getDay()] += 1;
  }

  // Repeat customer rate.
  const userCounts = new Map<string, number>();
  for (const b of bookings) userCounts.set(b.user_id, (userCounts.get(b.user_id) ?? 0) + 1);
  const repeatCustomers = [...userCounts.values()].filter((c) => c > 1).length;
  const repeatRate = userCounts.size ? repeatCustomers / userCounts.size : 0;

  res.json({
    totals: {
      total_bookings: total,
      completed,
      cancelled,
      completion_rate: total ? completed / total : 0,
      cancellation_rate: total ? cancelled / total : 0,
      repeat_rate: repeatRate,
    },
    revenue_series: Array.from(revByDay.entries()).map(([date, amount]) => ({ date, amount })),
    top_service: topService ? { name: topService[0], count: topService[1] } : null,
    busiest_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({ day, count: dow[i] })),
    rating: Number(tenant.rating),
    total_reviews: tenant.total_reviews,
  });
});
