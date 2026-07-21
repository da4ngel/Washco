import { supabaseAdmin } from '../config/supabase';
import { computeFees } from '../utils/helpers';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { Booking, Service, Tenant, TimeSlot } from '../types';

export interface CreateBookingInput {
  userId: string;
  tenantId: string;
  serviceId: string;
  slotId: string;
  userNotes?: string;
}

/**
 * Validates the tenant/service/slot, computes the fee split, and creates a
 * booking in `pending` / `unpaid` state. Payment confirmation (via webhook)
 * later flips it to confirmed and increments the slot.
 */
export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  const { userId, tenantId, serviceId, slotId, userNotes } = input;

  // Load tenant, service, slot in parallel.
  const [tenantRes, serviceRes, slotRes] = await Promise.all([
    supabaseAdmin.from('tenants').select('*').eq('id', tenantId).single<Tenant>(),
    supabaseAdmin.from('services').select('*').eq('id', serviceId).single<Service>(),
    supabaseAdmin.from('time_slots').select('*').eq('id', slotId).single<TimeSlot>(),
  ]);

  const tenant = tenantRes.data;
  const service = serviceRes.data;
  const slot = slotRes.data;

  if (!tenant) throw new NotFoundError('Car wash not found.');
  if (tenant.status !== 'active') throw new BadRequestError('This car wash is not accepting bookings.');
  if (!service || service.tenant_id !== tenantId) throw new BadRequestError('Invalid service for this car wash.');
  if (!service.is_active) throw new BadRequestError('This service is no longer available.');
  if (!slot || slot.tenant_id !== tenantId) throw new BadRequestError('Invalid time slot for this car wash.');

  // Availability checks.
  if (slot.is_blocked) throw new ConflictError('That time slot is unavailable.');
  if (slot.booked_count >= slot.capacity) throw new ConflictError('That time slot is fully booked.');

  const slotStart = new Date(`${slot.date}T${slot.start_time}`);
  if (slotStart.getTime() <= Date.now()) {
    throw new BadRequestError('That time slot is in the past.');
  }

  // Prevent duplicate active booking of the same slot by the same user.
  const { data: existing } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .eq('slot_id', slotId)
    .not('status', 'in', '(cancelled,no_show)')
    .maybeSingle();
  if (existing) throw new ConflictError('You already have a booking for this slot.');

  const { platformFee, tenantPayout } = computeFees(Number(service.price), Number(tenant.commission_rate));

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      service_id: serviceId,
      slot_id: slotId,
      status: 'pending',
      payment_status: 'unpaid',
      service_price: service.price,
      platform_fee: platformFee,
      tenant_payout: tenantPayout,
      user_notes: userNotes ?? null,
    })
    .select('*')
    .single<Booking>();

  if (error || !booking) {
    throw new BadRequestError(error?.message ?? 'Could not create booking.');
  }

  return booking;
};

/** Loads a booking with its related tenant, service and slot. */
export const getBookingWithRelations = async (bookingId: string): Promise<Booking | null> => {
  const { data } = await supabaseAdmin
    .from('bookings')
    .select('*, tenant:tenants(*), service:services(*), slot:time_slots(*)')
    .eq('id', bookingId)
    .maybeSingle<Booking>();
  return data;
};
