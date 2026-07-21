import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../utils/helpers';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { createNotification } from '../services/notification.service';
import { Booking, Review } from '../types';

/** POST /api/reviews — create a review for a completed booking. */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { booking_id, rating, comment } = req.body as { booking_id: string; rating: number; comment?: string };

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single<Booking>();
  if (!booking) throw new NotFoundError('Booking not found.');
  if (booking.user_id !== req.user.id) throw new ForbiddenError();
  if (booking.status !== 'completed') throw new BadRequestError('You can only review completed bookings.');

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .maybeSingle();
  if (existing) throw new ConflictError('You have already reviewed this booking.');

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      booking_id,
      user_id: req.user.id,
      tenant_id: booking.tenant_id,
      rating,
      comment: comment ?? null,
    })
    .select('*')
    .single<Review>();
  if (error) throw new BadRequestError(error.message);

  // Notify the tenant owner.
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('owner_id')
    .eq('id', booking.tenant_id)
    .single<{ owner_id: string }>();
  if (tenant) {
    await createNotification({
      userId: tenant.owner_id,
      title: 'New review',
      body: `You received a ${rating}-star review.`,
      type: 'new_review',
      data: { booking_id, review_id: data.id },
    });
  }

  res.status(201).json({ review: data });
});

/** PUT /api/reviews/:id — edit own review. */
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { data: review } = await supabaseAdmin.from('reviews').select('*').eq('id', req.params.id).single<Review>();
  if (!review) throw new NotFoundError('Review not found.');
  if (review.user_id !== req.user.id) throw new ForbiddenError();

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(req.body)
    .eq('id', req.params.id)
    .select('*')
    .single<Review>();
  if (error) throw new BadRequestError(error.message);
  res.json({ review: data });
});

/** DELETE /api/reviews/:id — delete own review. */
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { data: review } = await supabaseAdmin.from('reviews').select('*').eq('id', req.params.id).single<Review>();
  if (!review) throw new NotFoundError('Review not found.');
  if (review.user_id !== req.user.id && req.user.profile.role !== 'admin') throw new ForbiddenError();

  const { error } = await supabaseAdmin.from('reviews').delete().eq('id', req.params.id);
  if (error) throw new BadRequestError(error.message);

  // Recompute the tenant rating (the trigger only fires on insert/update).
  const { data: agg } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('tenant_id', review.tenant_id)
    .eq('is_visible', true);
  const count = agg?.length ?? 0;
  const avg = count ? (agg ?? []).reduce((s, r) => s + (r as { rating: number }).rating, 0) / count : 0;
  await supabaseAdmin.from('tenants').update({ rating: avg, total_reviews: count }).eq('id', review.tenant_id);

  res.json({ message: 'Review deleted.' });
});

/** PUT /api/reviews/:id/reply — tenant owner replies to a review. */
export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { tenant_reply } = req.body as { tenant_reply: string };

  const { data: review } = await supabaseAdmin.from('reviews').select('*').eq('id', req.params.id).single<Review>();
  if (!review) throw new NotFoundError('Review not found.');

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('owner_id')
    .eq('id', review.tenant_id)
    .single<{ owner_id: string }>();
  if (tenant?.owner_id !== req.user.id && req.user.profile.role !== 'admin') throw new ForbiddenError();

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ tenant_reply })
    .eq('id', req.params.id)
    .select('*')
    .single<Review>();
  if (error) throw new BadRequestError(error.message);

  await createNotification({
    userId: review.user_id,
    title: 'The car wash replied',
    body: 'The business responded to your review.',
    type: 'review_reply',
    data: { review_id: review.id },
  });

  res.json({ review: data });
});
