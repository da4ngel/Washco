import Stripe from 'stripe';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { createNotification } from './notification.service';
import { Booking } from '../types';

/**
 * Marks a booking paid + confirmed, increments the slot's booked_count, and
 * notifies both the user and the tenant owner. Triggered by the Stripe
 * `payment_intent.succeeded` webhook.
 */
export const handlePaymentIntentSucceeded = async (intent: Stripe.PaymentIntent): Promise<void> => {
  const bookingId = intent.metadata?.booking_id;
  if (!bookingId) {
    logger.warn(`payment_intent.succeeded ${intent.id} has no booking_id metadata`);
    return;
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single<Booking>();

  if (error || !booking) {
    logger.error(`Booking ${bookingId} not found for succeeded payment ${intent.id}`);
    return;
  }

  if (booking.payment_status === 'paid') {
    logger.debug(`Booking ${bookingId} already paid — webhook is a duplicate, skipping.`);
    return;
  }

  const chargeId =
    typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id ?? null;

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_charge_id: chargeId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (updateError) {
    logger.error(`Failed to update booking ${bookingId} after payment: ${updateError.message}`);
    return;
  }

  // Increment the slot's booked_count atomically via RPC-free read+write.
  await incrementSlotBookedCount(booking.slot_id);

  // Increment the tenant's lifetime booking counter.
  await supabaseAdmin.rpc('increment_tenant_bookings', { p_tenant_id: booking.tenant_id }).then(
    () => undefined,
    () => undefined // RPC is optional; ignore if not present
  );

  // Notify the customer (in-app + email).
  await createNotification({
    userId: booking.user_id,
    title: 'Booking confirmed',
    body: `Your booking ${booking.booking_ref} is confirmed and paid.`,
    type: 'booking_confirmed',
    data: { booking_id: booking.id, booking_ref: booking.booking_ref },
    email: true,
  });

  // Notify the tenant owner.
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('owner_id, business_name')
    .eq('id', booking.tenant_id)
    .single<{ owner_id: string; business_name: string }>();

  if (tenant) {
    await createNotification({
      userId: tenant.owner_id,
      title: 'New booking',
      body: `You have a new booking ${booking.booking_ref}.`,
      type: 'new_booking',
      data: { booking_id: booking.id, booking_ref: booking.booking_ref },
      email: true,
    });
  }

  logger.info(`Booking ${booking.booking_ref} confirmed via payment ${intent.id}`);
};

/** Marks a booking's payment as failed. */
export const handlePaymentIntentFailed = async (intent: Stripe.PaymentIntent): Promise<void> => {
  const bookingId = intent.metadata?.booking_id;
  if (!bookingId) return;

  await supabaseAdmin.from('bookings').update({ payment_status: 'failed' }).eq('id', bookingId);
  logger.warn(`Payment failed for booking ${bookingId} (intent ${intent.id})`);
};

/** Reads the slot then writes booked_count + 1 (bounded by capacity). */
async function incrementSlotBookedCount(slotId: string): Promise<void> {
  const { data: slot } = await supabaseAdmin
    .from('time_slots')
    .select('booked_count, capacity')
    .eq('id', slotId)
    .single<{ booked_count: number; capacity: number }>();

  if (!slot) return;

  await supabaseAdmin
    .from('time_slots')
    .update({ booked_count: Math.min(slot.capacity, slot.booked_count + 1) })
    .eq('id', slotId);
}
