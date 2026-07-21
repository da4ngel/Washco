import { describe, it, expect } from 'vitest';
import { buildSlotRows, slotLengthFor } from './slot.service';
import { OperatingHour } from '../types';

const openDay = (day: OperatingHour['day_of_week'], open = '09:00', close = '17:00'): OperatingHour =>
  ({ id: day, tenant_id: 't1', day_of_week: day, open_time: open, close_time: close, is_closed: false } as OperatingHour);

describe('slotLengthFor', () => {
  it('uses the shortest active service duration', () => {
    expect(slotLengthFor([60, 30, 45])).toBe(30);
  });

  it('enforces a 15-minute floor', () => {
    expect(slotLengthFor([10, 5])).toBe(15);
  });

  it('falls back to the default when there are no services', () => {
    expect(slotLengthFor([])).toBe(30);
  });
});

describe('buildSlotRows', () => {
  // A fixed Monday so the test is deterministic regardless of when it runs.
  const monday = new Date('2026-01-05T00:00:00'); // 2026-01-05 is a Monday

  it('splits an open day into fixed-length slots', () => {
    const rows = buildSlotRows({
      tenantId: 't1',
      operatingHours: [openDay('monday', '09:00', '12:00')],
      durations: [30],
      days: 1,
      capacity: 1,
      from: monday,
    });
    // 09:00–12:00 at 30m = 6 slots
    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({ start_time: '09:00:00', end_time: '09:30:00', capacity: 1 });
    expect(rows[5]).toMatchObject({ start_time: '11:30:00', end_time: '12:00:00' });
  });

  it('skips closed days and days with no operating hours', () => {
    const rows = buildSlotRows({
      tenantId: 't1',
      operatingHours: [{ ...openDay('monday'), is_closed: true }],
      durations: [30],
      days: 7,
      capacity: 1,
      from: monday,
    });
    expect(rows).toHaveLength(0);
  });

  it('does not emit a trailing partial slot past closing time', () => {
    const rows = buildSlotRows({
      tenantId: 't1',
      operatingHours: [openDay('monday', '09:00', '10:10')],
      durations: [30],
      days: 1,
      capacity: 1,
      from: monday,
    });
    // 09:00–10:10 at 30m fits 2 full slots (last ends 10:00); 10:00–10:30 would overrun.
    expect(rows).toHaveLength(2);
    expect(rows.at(-1)).toMatchObject({ end_time: '10:00:00' });
  });

  it('honours a custom capacity', () => {
    const rows = buildSlotRows({
      tenantId: 't1',
      operatingHours: [openDay('monday', '09:00', '10:00')],
      durations: [60],
      days: 1,
      capacity: 3,
      from: monday,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].capacity).toBe(3);
  });
});
