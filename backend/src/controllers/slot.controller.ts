import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../utils/helpers';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { generateSlots, clearFutureUnbookedSlots } from '../services/slot.service';
import { TimeSlot } from '../types';

async function ownedTenantId(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle<{ id: string }>();
  if (!data) throw new NotFoundError('No business found for this account.');
  return data.id;
}

async function assertOwnsSlot(slotId: string, tenantId: string): Promise<TimeSlot> {
  const { data } = await supabaseAdmin.from('time_slots').select('*').eq('id', slotId).single<TimeSlot>();
  if (!data) throw new NotFoundError('Slot not found.');
  if (data.tenant_id !== tenantId) throw new ForbiddenError();
  return data;
}

/** GET /api/slots/tenant/:tenantId?from&to — public slot list for booking. */
export const getSlotsForTenant = asyncHandler(async (req: Request, res: Response) => {
  const from = (req.query.from as string) ?? new Date().toISOString().slice(0, 10);
  const to = (req.query.to as string) ?? new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('time_slots')
    .select('*')
    .eq('tenant_id', req.params.tenantId)
    .gte('date', from)
    .lte('date', to)
    .order('date')
    .order('start_time');
  if (error) throw error;

  const now = Date.now();
  const slots = (data ?? []).map((s: TimeSlot) => ({
    ...s,
    available: !s.is_blocked && s.booked_count < s.capacity && new Date(`${s.date}T${s.start_time}`).getTime() > now,
  }));
  res.json({ data: slots });
});

/** POST /api/slots/generate — generate slots from operating hours. */
export const generate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  const { days, capacity, regenerate } = req.body as { days: number; capacity: number; regenerate: boolean };

  if (regenerate) {
    await clearFutureUnbookedSlots(tenantId);
  }
  const generated = await generateSlots({ tenantId, days, capacity });
  res.json({ message: `Slots generated for the next ${days} days.`, generated });
});

/** PUT /api/slots/:id/block */
export const blockSlot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  const slot = await assertOwnsSlot(req.params.id, tenantId);
  if (slot.booked_count > 0) throw new BadRequestError('Cannot block a slot that already has bookings.');

  const { error } = await supabaseAdmin.from('time_slots').update({ is_blocked: true }).eq('id', slot.id);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Slot blocked.' });
});

/** PUT /api/slots/:id/unblock */
export const unblockSlot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  const slot = await assertOwnsSlot(req.params.id, tenantId);

  const { error } = await supabaseAdmin.from('time_slots').update({ is_blocked: false }).eq('id', slot.id);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Slot unblocked.' });
});

/** POST /api/slots/bulk-block — block/unblock many slots at once. */
export const bulkBlock = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  const { slot_ids, block } = req.body as { slot_ids: string[]; block: boolean };

  const { error } = await supabaseAdmin
    .from('time_slots')
    .update({ is_blocked: block })
    .in('id', slot_ids)
    .eq('tenant_id', tenantId)
    .eq('booked_count', 0);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: block ? 'Slots blocked.' : 'Slots unblocked.' });
});
