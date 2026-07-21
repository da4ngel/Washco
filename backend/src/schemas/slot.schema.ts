import { z } from 'zod';

export const generateSlotsSchema = z.object({
  days: z.number().int().min(1).max(60).optional().default(30),
  capacity: z.number().int().min(1).max(20).optional().default(1),
  regenerate: z.boolean().optional().default(false),
});

export const bulkBlockSchema = z.object({
  slot_ids: z.array(z.string().uuid()).min(1).max(500),
  block: z.boolean().default(true),
});

export const slotRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
