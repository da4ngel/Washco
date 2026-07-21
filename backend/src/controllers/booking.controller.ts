import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { stripe } from '../config/stripe';
import { isConfigured } from '../config/env';
import { logger } from '../config/logger';
import { asyncHandler, parsePagination } from '../utils/helpers';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { createBooking, getBookingWithRelations } from '../services/booking.service';
import { createNotification } from '../services/notification.service';
import { CreateBookingBody } from '../schemas/booking.schema';
import { Booking, BookingStatus } from '../types';

/** True if the user owns the booking, owns the tenant, or is an admin. */
async function canAccessBooking(booking: Booking, userId: string, role: string): Promise<boolean> {
  if (role === 'admin') return true;
  if (booking.user_id === userId) return true;
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('owner_id')
    .eq('id', booking.tenant_id)
    .single<{ owner_id: string }>();
  return data?.owner_id === userId;
}

/** POST /api/bookings — create a booking (customer). */
export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const body = req.body as CreateBookingBody;

  const booking = await createBooking({
    userId: req.user.id,
    tenantId: body.tenant_id,
    serviceId: body.service_id,
    slotId: body.slot_id,
    userNotes: body.user_notes,
  });

  const full = await getBookingWithRelations(booking.id);
  res.status(201).json({ booking: full ?? booking });
});

/** GET /api/bookings/:id — booking detail (owner / tenant / admin). */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const booking = await getBookingWithRelations(req.params.id);
  if (!booking) throw new NotFoundError('Booking not found.');

  const allowed = await canAccessBooking(booking, req.user.id, req.user.profile.role);
  if (!allowed) throw new ForbiddenError();

  // Attach the review if one exists (used to gate the "leave a review" CTA).
  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('booking_id', booking.id)
    .maybeSingle();

  res.json({ booking: { ...booking, review: review ?? null } });
});

/** Loads a booking and asserts the caller owns the tenant it belongs to. */
async function loadForTenant(bookingId: string, userId: string, role: string): Promise<Booking> {
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single<Booking>();
  if (!booking) throw new NotFoundError('Booking not found.');

  if (role !== 'admin') {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('owner_id')
      .eq('id', booking.tenant_id)
      .single<{ owner_id: string }>();
    if (tenant?.owner_id !== userId) throw new ForbiddenError();
  }
  return booking;
}

/** Valid forward transitions a tenant may perform. */
const NEXT_STATUS: Record<string, BookingStatus> = {
  confirm: 'confirmed',
  start: 'in_progress',
  complete: 'completed',
};
const REQUIRED_FROM: Record<string, BookingStatus[]> = {
  confirm: ['pending', 'confirmed'],
  start: ['confirmed'],
  complete: ['in_progress', 'confirmed'],
};

function makeTransition(action: 'confirm' | 'start' | 'complete') {
  return asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const booking = await loadForTenant(req.params.id, req.user.id, req.user.profile.role);

    if (!REQUIRED_FROM[action].includes(booking.status)) {
      throw new BadRequestError(`Cannot ${action} a booking that is ${booking.status}.`);
    }

    const patch: Record<string, unknown> = { status: NEXT_STATUS[action] };
    if (action === 'confirm') patch.confirmed_at = new Date().toISOString();
    if (action === 'complete') patch.completed_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from('bookings').update(patch).eq('id', booking.id);
    if (error) throw new BadRequestError(error.message);

    // Notify the customer on each transition.
    const messages: Record<string, { title: string; body: string; type: string }> = {
      confirm: { title: 'Booking confirmed', body: `Your booking ${booking.booking_ref} was confirmed.`, type: 'booking_confirmed' },
      start: { title: 'Wash in progress', body: `Work has started on ${booking.booking_ref}.`, type: 'booking_in_progress' },
      complete: { title: 'Wash complete', body: `Your booking ${booking.booking_ref} is done. Leave a review!`, type: 'booking_completed' },
    };
    await createNotification({ userId: booking.user_id, ...messages[action], data: { booking_id: booking.id } });

    const full = await getBookingWithRelations(booking.id);
    res.json({ booking: full });
  });
}

export const confirmBooking = makeTransition('confirm');
export const startBooking = makeTransition('start');
export const completeBooking = makeTransition('complete');

/** POST /api/bookings/:id/cancel — user or tenant cancels; refunds if paid. */
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };

  const booking = await getBookingWithRelations(id);
  if (!booking) throw new NotFoundError('Booking not found.');

  const isOwner = booking.user_id === req.user.id;
  const allowed = await canAccessBooking(booking, req.user.id, req.user.profile.role);
  if (!allowed) throw new ForbiddenError();

  if (['completed', 'cancelled', 'no_show'].includes(booking.status)) {
    throw new BadRequestError(`Cannot cancel a booking that is ${booking.status}.`);
  }

  // Refund if already paid and Stripe is configured.
  let paymentStatus = booking.payment_status;
  if (booking.payment_status === 'paid' && booking.stripe_payment_intent_id && isConfigured.stripe) {
    try {
      await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id });
      paymentStatus = 'refunded';
    } catch (err) {
      logger.error(`Refund failed for booking ${booking.id}: ${(err as Error).message}`);
    }
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: paymentStatus,
      cancellation_reason: reason ?? (isOwner ? 'Cancelled by customer' : 'Cancelled by car wash'),
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', booking.id);
  if (error) throw new BadRequestError(error.message);

  // Free the slot if it had been counted.
  if (booking.payment_status === 'paid' && booking.slot) {
    await supabaseAdmin
      .from('time_slots')
      .update({ booked_count: Math.max(0, booking.slot.booked_count - 1) })
      .eq('id', booking.slot_id);
  }

  // Notify the counterparty.
  const notifyUserId = isOwner ? null : booking.user_id;
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      title: 'Booking cancelled',
      body: `Your booking ${booking.booking_ref} was cancelled.${paymentStatus === 'refunded' ? ' A refund has been issued.' : ''}`,
      type: 'booking_cancelled',
      data: { booking_id: booking.id },
    });
  }

  const full = await getBookingWithRelations(booking.id);
  res.json({ booking: full });
});

/** POST /api/bookings/:id/photos — tenant attaches before/after photo URLs. */
export const uploadBookingPhotos = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const booking = await loadForTenant(req.params.id, req.user.id, req.user.profile.role);
  const { before_photo_url, after_photo_url } = req.body as {
    before_photo_url?: string;
    after_photo_url?: string;
  };

  const patch: Record<string, unknown> = {};
  if (before_photo_url) patch.before_photo_url = before_photo_url;
  if (after_photo_url) patch.after_photo_url = after_photo_url;
  if (Object.keys(patch).length === 0) throw new BadRequestError('No photo URLs provided.');

  const { error } = await supabaseAdmin.from('bookings').update(patch).eq('id', booking.id);
  if (error) throw new BadRequestError(error.message);

  const full = await getBookingWithRelations(booking.id);
  res.json({ booking: full });
});

/** GET /api/bookings/tenant/all — paginated bookings for the caller's tenant. */
export const listTenantBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('owner_id', req.user.id)
    .maybeSingle<{ id: string }>();
  if (!tenant) throw new NotFoundError('No business found for this account.');

  const status = req.query.status as BookingStatus | undefined;
  const { page, limit, from, to } = parsePagination(req.query as Record<string, unknown>);

  let query = supabaseAdmin
    .from('bookings')
    .select('*, service:services(*), slot:time_slots(*), user:profiles(full_name,phone,avatar_url)', {
      count: 'exact',
    })
    .eq('tenant_id', tenant.id);

  if (status) query = query.eq('status', status);

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
