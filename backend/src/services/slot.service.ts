import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { timeToMinutes, minutesToTime, DAYS_OF_WEEK } from '../utils/helpers';
import { OperatingHour, Service } from '../types';

const DEFAULT_SLOT_MINUTES = 30;

interface GenerateOptions {
  tenantId: string;
  /** How many days ahead to generate (default 30). */
  days?: number;
  /** Capacity per slot (default 1). */
  capacity?: number;
}

export interface SlotRow {
  tenant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

/** Slot length = shortest active service duration on a 15m floor, else the default. */
export const slotLengthFor = (durations: number[]): number =>
  durations.length > 0 ? Math.max(15, Math.min(...durations)) : DEFAULT_SLOT_MINUTES;

/**
 * Pure slot enumeration: given operating hours and service durations, build the
 * slot rows for `days` days starting at `from`. No DB access — unit-testable.
 */
export const buildSlotRows = (params: {
  tenantId: string;
  operatingHours: OperatingHour[];
  durations: number[];
  days: number;
  capacity: number;
  from: Date;
}): SlotRow[] => {
  const { tenantId, operatingHours, durations, days, capacity, from } = params;
  const slotMinutes = slotLengthFor(durations);

  const byDay = new Map<string, OperatingHour>();
  for (const h of operatingHours) byDay.set(h.day_of_week, h);

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const rows: SlotRow[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dayName = DAYS_OF_WEEK[date.getDay()];
    const hours = byDay.get(dayName);
    if (!hours || hours.is_closed) continue;

    const open = timeToMinutes(hours.open_time);
    const close = timeToMinutes(hours.close_time);
    const dateStr = date.toISOString().slice(0, 10);

    for (let t = open; t + slotMinutes <= close; t += slotMinutes) {
      rows.push({
        tenant_id: tenantId,
        date: dateStr,
        start_time: minutesToTime(t),
        end_time: minutesToTime(t + slotMinutes),
        capacity,
      });
    }
  }
  return rows;
};

/**
 * Generates time slots for a tenant over the next N days, based on their
 * operating hours. Slot length = shortest active service duration (min 30m).
 * Skips closed days and never touches existing (booked) slots.
 */
export const generateSlots = async ({ tenantId, days = 30, capacity = 1 }: GenerateOptions): Promise<number> => {
  const [{ data: hours }, { data: services }] = await Promise.all([
    supabaseAdmin.from('operating_hours').select('*').eq('tenant_id', tenantId),
    supabaseAdmin.from('services').select('duration_minutes').eq('tenant_id', tenantId).eq('is_active', true),
  ]);

  const operatingHours = (hours ?? []) as OperatingHour[];
  if (operatingHours.length === 0) {
    logger.warn(`No operating hours for tenant ${tenantId}; cannot generate slots.`);
    return 0;
  }

  const durations = (services ?? []).map((s: Pick<Service, 'duration_minutes'>) => s.duration_minutes);
  const rows = buildSlotRows({
    tenantId,
    operatingHours,
    durations,
    days,
    capacity,
    from: new Date(),
  });

  if (rows.length === 0) return 0;

  // upsert; the unique (tenant_id, date, start_time) constraint means existing
  // slots (including booked ones) are left untouched via ignoreDuplicates.
  const { error } = await supabaseAdmin
    .from('time_slots')
    .upsert(rows, { onConflict: 'tenant_id,date,start_time', ignoreDuplicates: true });

  if (error) {
    logger.error(`Slot generation failed for tenant ${tenantId}: ${error.message}`);
    throw error;
  }

  logger.info(`Generated up to ${rows.length} slots for tenant ${tenantId} (${slotLengthFor(durations)}m each).`);
  return rows.length;
};

/**
 * Deletes future, unbooked, non-blocked slots. Called before regenerating when
 * operating hours change so stale slots don't linger.
 */
export const clearFutureUnbookedSlots = async (tenantId: string): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabaseAdmin
    .from('time_slots')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('booked_count', 0)
    .eq('is_blocked', false)
    .gte('date', today);
  if (error) {
    logger.error(`Failed clearing future slots for tenant ${tenantId}: ${error.message}`);
    throw error;
  }
};
