import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { env, isConfigured } from '../config/env';
import { logger } from '../config/logger';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, round2 } from '../utils/helpers';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../utils/errors';
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from '../services/payment.service';
import { getBookingWithRelations } from '../services/booking.service';
import { Booking } from '../types';

/**
 * POST /api/payments/create-intent — creates (or reuses) a Stripe PaymentIntent
 * for a booking and returns its client_secret for the frontend to confirm.
 */
export const createIntent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  if (!isConfigured.stripe) throw new ServiceUnavailableError('Payments are not configured.');

  const { booking_id } = req.body as { booking_id: string };

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single<Booking>();
  if (error || !booking) throw new NotFoundError('Booking not found.');
  if (booking.user_id !== req.user.id) throw new ForbiddenError();
  if (booking.payment_status === 'paid') throw new BadRequestError('This booking is already paid.');

  // Amount in the smallest currency unit (LKR cents).
  const amount = Math.round(round2(Number(booking.service_price)) * 100);

  let intent: Stripe.PaymentIntent;
  if (booking.stripe_payment_intent_id) {
    // Reuse the existing intent (avoids creating duplicates on retries).
    intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
    if (intent.amount !== amount || intent.status === 'canceled') {
      intent = await stripe.paymentIntents.create(buildIntentParams(amount, booking));
    }
  } else {
    intent = await stripe.paymentIntents.create(buildIntentParams(amount, booking));
  }

  if (booking.stripe_payment_intent_id !== intent.id) {
    await supabaseAdmin.from('bookings').update({ stripe_payment_intent_id: intent.id }).eq('id', booking.id);
  }

  res.json({ client_secret: intent.client_secret, amount, currency: 'lkr' });
});

function buildIntentParams(amount: number, booking: Booking): Stripe.PaymentIntentCreateParams {
  return {
    amount,
    currency: 'lkr',
    automatic_payment_methods: { enabled: true },
    metadata: {
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      user_id: booking.user_id,
      tenant_id: booking.tenant_id,
    },
  };
}

/**
 * POST /api/payments/confirm — called after the frontend confirms the card.
 * Verifies the PaymentIntent status and, if it already succeeded, applies the
 * booking update immediately (idempotent with the webhook).
 */
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const { booking_id, payment_intent_id } = req.body as { booking_id: string; payment_intent_id: string };

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single<Booking>();
  if (!booking) throw new NotFoundError('Booking not found.');
  if (booking.user_id !== req.user.id) throw new ForbiddenError();

  if (isConfigured.stripe) {
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status === 'succeeded' && booking.payment_status !== 'paid') {
      await handlePaymentIntentSucceeded(intent);
    }
  }

  const full = await getBookingWithRelations(booking.id);
  res.json({ booking: full ?? booking });
});

/**
 * Stripe webhook endpoint. Mounted with express.raw() so req.body is a Buffer.
 * Verifies the signature, then dispatches on event type.
 *
 * NOTE: this is intentionally registered directly in index.ts (before the JSON
 * body parser) rather than via the normal router.
 */
export const paymentWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  if (!isConfigured.stripe || !env.stripeWebhookSecret) {
    logger.warn('Stripe webhook called but Stripe is not configured — ignoring.');
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.stripeWebhookSecret);
  } catch (err) {
    logger.error(`Stripe webhook signature verification failed: ${(err as Error).message}`);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Error handling Stripe webhook ${event.type}: ${(err as Error).message}`);
    // Return 200 so Stripe doesn't retry indefinitely on a logic bug; we've logged it.
    res.status(200).json({ received: true, handled: false });
  }
};
