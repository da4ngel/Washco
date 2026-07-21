import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, parsePagination } from '../utils/helpers';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { Profile } from '../types';

/** GET /api/users/profile */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json({ profile: req.user.profile });
});

/** PUT /api/users/profile — update name, phone, avatar. */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { full_name, phone, avatar_url } = req.body as {
    full_name?: string;
    phone?: string | null;
    avatar_url?: string | null;
  };

  const patch: Record<string, unknown> = {};
  if (full_name !== undefined) patch.full_name = full_name;
  if (phone !== undefined) patch.phone = phone;
  if (avatar_url !== undefined) patch.avatar_url = avatar_url;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', req.user.id)
    .select('*')
    .single<Profile>();
  if (error) throw new BadRequestError(error.message);
  res.json({ profile: data });
});

/** GET /api/users/bookings — paginated booking history with filters. */
export const listMyBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);
  const scope = (req.query.scope as string) ?? 'all';
  const status = req.query.status as string | undefined;

  let query = supabaseAdmin
    .from('bookings')
    .select(
      '*, tenant:tenants(business_name,slug,address), service:services(name,duration_minutes), slot:time_slots(date,start_time), review:reviews(id,rating)',
      { count: 'exact' }
    )
    .eq('user_id', req.user.id);

  if (status) query = query.eq('status', status);
  if (scope === 'upcoming') query = query.in('status', ['pending', 'confirmed', 'in_progress']);
  if (scope === 'past') query = query.in('status', ['completed', 'cancelled', 'no_show']);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;

  res.json({
    data: data ?? [],
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
});

/** GET /api/users/notifications — paginated. */
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);

  const { data, count } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  const { count: unread } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false);

  res.json({
    data: data ?? [],
    unread: unread ?? 0,
    page,
    limit,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
});

/** PUT /api/users/notifications/:id/read */
export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  res.json({ message: 'Marked as read.' });
});

/** PUT /api/users/notifications/read-all */
export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
  res.json({ message: 'All notifications marked as read.' });
});

/** GET /api/users/wash-passes — active wash passes. */
export const listWashPasses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { data } = await supabaseAdmin
    .from('wash_passes')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  res.json({ data: data ?? [] });
});
