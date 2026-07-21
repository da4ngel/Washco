import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, parsePagination } from '../utils/helpers';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { createNotification } from '../services/notification.service';
import { Booking, Tenant } from '../types';

/** GET /api/admin/dashboard — platform-wide stats. */
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [users, activeTenants, pendingTenants, subs] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('tenant_subscriptions').select('monthly_fee').eq('status', 'active'),
  ]);

  const mrr = (subs.data ?? []).reduce((sum, s) => sum + Number((s as { monthly_fee: number }).monthly_fee), 0);

  // Bookings + revenue over the last 30 days.
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: recentBookings } = await supabaseAdmin
    .from('bookings')
    .select('id, platform_fee, status, payment_status, created_at, booking_ref, service:services(name), tenant:tenants(business_name)')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const bookings = (recentBookings ?? []) as unknown as (Booking & {
    service?: { name: string };
    tenant?: { business_name: string };
  })[];

  const today = new Date().toISOString().slice(0, 10);
  const bookingsToday = bookings.filter((b) => b.created_at.slice(0, 10) === today).length;

  // Daily revenue series (platform fee from paid bookings).
  const revenueByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    revenueByDay.set(d, 0);
  }
  for (const b of bookings) {
    if (b.payment_status === 'paid') {
      const d = b.created_at.slice(0, 10);
      if (revenueByDay.has(d)) revenueByDay.set(d, (revenueByDay.get(d) ?? 0) + Number(b.platform_fee));
    }
  }

  res.json({
    stats: {
      total_users: users.count ?? 0,
      active_tenants: activeTenants.count ?? 0,
      pending_tenants: pendingTenants.count ?? 0,
      bookings_today: bookingsToday,
      mrr,
    },
    revenue_series: Array.from(revenueByDay.entries()).map(([date, amount]) => ({ date, amount })),
    recent_bookings: bookings.slice(0, 10),
  });
});

/** GET /api/admin/tenants — all tenants with optional status filter. */
export const listTenants = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('tenants')
    .select('*, owner:profiles!tenants_owner_id_fkey(full_name,phone)', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  res.json({ data: data ?? [], page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) });
});

/** GET /api/admin/tenants/:id — full tenant detail. */
export const getTenantDetail = asyncHandler(async (req: Request, res: Response) => {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('*, owner:profiles!tenants_owner_id_fkey(*)')
    .eq('id', req.params.id)
    .maybeSingle();
  if (!tenant) throw new NotFoundError('Tenant not found.');

  const [services, photos, bookings] = await Promise.all([
    supabaseAdmin.from('services').select('*').eq('tenant_id', req.params.id),
    supabaseAdmin.from('tenant_photos').select('*').eq('tenant_id', req.params.id),
    supabaseAdmin.from('bookings').select('id,status,service_price', { count: 'exact', head: false }).eq('tenant_id', req.params.id),
  ]);

  res.json({ ...tenant, services: services.data ?? [], photos: photos.data ?? [], booking_count: bookings.data?.length ?? 0 });
});

async function setTenantStatus(id: string, status: Tenant['status']): Promise<Tenant> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single<Tenant>();
  if (error || !data) throw new BadRequestError(error?.message ?? 'Update failed.');
  return data;
}

/** PUT /api/admin/tenants/:id/approve */
export const approveTenant = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await setTenantStatus(req.params.id, 'active');
  await createNotification({
    userId: tenant.owner_id,
    title: 'Business approved 🎉',
    body: `${tenant.business_name} is now live on WashCo.`,
    type: 'tenant_approved',
    data: { tenant_id: tenant.id },
    email: true,
  });
  res.json({ tenant });
});

/** PUT /api/admin/tenants/:id/reject */
export const rejectTenant = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const tenant = await setTenantStatus(req.params.id, 'rejected');
  await createNotification({
    userId: tenant.owner_id,
    title: 'Business application rejected',
    body: reason ? `Reason: ${reason}` : 'Your application was not approved.',
    type: 'tenant_rejected',
    data: { tenant_id: tenant.id },
    email: true,
  });
  res.json({ tenant });
});

/** PUT /api/admin/tenants/:id/suspend */
export const suspendTenant = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await setTenantStatus(req.params.id, 'suspended');
  await createNotification({
    userId: tenant.owner_id,
    title: 'Business suspended',
    body: 'Your business has been suspended. Please contact support.',
    type: 'tenant_suspended',
    data: { tenant_id: tenant.id },
    email: true,
  });
  res.json({ tenant });
});

/** PUT /api/admin/tenants/:id/reinstate */
export const reinstateTenant = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await setTenantStatus(req.params.id, 'active');
  res.json({ tenant });
});

/** PUT /api/admin/tenants/:id/featured — toggle featured. */
export const toggleFeatured = asyncHandler(async (req: Request, res: Response) => {
  const { data: current } = await supabaseAdmin
    .from('tenants')
    .select('is_featured')
    .eq('id', req.params.id)
    .single<{ is_featured: boolean }>();
  if (!current) throw new NotFoundError('Tenant not found.');

  const next = !current.is_featured;
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .update({ is_featured: next, featured_until: next ? new Date(Date.now() + 30 * 86_400_000).toISOString() : null })
    .eq('id', req.params.id)
    .select('*')
    .single<Tenant>();
  if (error) throw new BadRequestError(error.message);
  res.json({ tenant: data });
});

/** GET /api/admin/bookings — all bookings across the platform. */
export const listAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('bookings')
    .select('*, tenant:tenants(business_name), service:services(name), user:profiles(full_name)', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  res.json({ data: data ?? [], page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) });
});

/** GET /api/admin/users — all user accounts. */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);
  const role = req.query.role as string | undefined;

  let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' });
  if (role) query = query.eq('role', role);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;
  res.json({ data: data ?? [], page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) });
});

/** PUT /api/admin/users/:id/ban — toggle account active state. */
export const toggleBanUser = asyncHandler(async (req: Request, res: Response) => {
  const { data: current } = await supabaseAdmin
    .from('profiles')
    .select('is_active')
    .eq('id', req.params.id)
    .single<{ is_active: boolean }>();
  if (!current) throw new NotFoundError('User not found.');

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: !current.is_active })
    .eq('id', req.params.id)
    .select('*')
    .single();
  if (error) throw new BadRequestError(error.message);
  res.json({ profile: data });
});

/** GET /api/admin/revenue?period=day|week|month — revenue report. */
export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as string) ?? 'day';
  const days = period === 'month' ? 365 : period === 'week' ? 90 : 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('platform_fee, service_price, created_at, payment_status')
    .gte('created_at', since)
    .eq('payment_status', 'paid');

  const bucket = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (period === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (period === 'week') {
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86_400_000 + onejan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    return d.toISOString().slice(0, 10);
  };

  const series = new Map<string, { commission: number; gmv: number; count: number }>();
  for (const b of data ?? []) {
    const key = bucket((b as { created_at: string }).created_at);
    const cur = series.get(key) ?? { commission: 0, gmv: 0, count: 0 };
    cur.commission += Number((b as { platform_fee: number }).platform_fee);
    cur.gmv += Number((b as { service_price: number }).service_price);
    cur.count += 1;
    series.set(key, cur);
  }

  const totalCommission = (data ?? []).reduce((s, b) => s + Number((b as { platform_fee: number }).platform_fee), 0);
  const totalGmv = (data ?? []).reduce((s, b) => s + Number((b as { service_price: number }).service_price), 0);

  res.json({
    period,
    total_commission: totalCommission,
    total_gmv: totalGmv,
    total_bookings: data?.length ?? 0,
    series: Array.from(series.entries())
      .map(([bucket, v]) => ({ bucket, ...v }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket)),
  });
});

/** POST /api/admin/payouts/calculate — create pending payout rows per tenant. */
export const calculatePayouts = asyncHandler(async (_req: Request, res: Response) => {
  // Sum unpaid-out completed bookings per tenant for the current month.
  const periodStart = new Date();
  periodStart.setDate(1);
  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = new Date().toISOString().slice(0, 10);

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('tenant_id, tenant_payout')
    .eq('status', 'completed')
    .eq('payment_status', 'paid')
    .gte('created_at', periodStartStr);

  const byTenant = new Map<string, { amount: number; count: number }>();
  for (const b of bookings ?? []) {
    const row = b as { tenant_id: string; tenant_payout: number };
    const cur = byTenant.get(row.tenant_id) ?? { amount: 0, count: 0 };
    cur.amount += Number(row.tenant_payout);
    cur.count += 1;
    byTenant.set(row.tenant_id, cur);
  }

  const payoutRows = Array.from(byTenant.entries()).map(([tenant_id, v]) => ({
    tenant_id,
    amount: v.amount,
    booking_count: v.count,
    period_start: periodStartStr,
    period_end: periodEndStr,
    status: 'pending',
  }));

  let created = 0;
  if (payoutRows.length > 0) {
    const { data, error } = await supabaseAdmin.from('payouts').insert(payoutRows).select('id');
    if (error) throw new BadRequestError(error.message);
    created = data?.length ?? payoutRows.length;
  }

  res.json({ message: `Calculated payouts for ${created} tenants.`, created });
});

/** POST /api/admin/payouts/process — mark pending payouts as completed. */
export const processPayouts = asyncHandler(async (req: Request, res: Response) => {
  const { payout_ids } = req.body as { payout_ids?: string[] };
  let query = supabaseAdmin
    .from('payouts')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('status', 'pending');
  if (payout_ids && payout_ids.length > 0) query = query.in('id', payout_ids);

  const { error } = await query;
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Payouts processed.' });
});
