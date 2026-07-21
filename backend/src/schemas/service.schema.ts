import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
  price: z.number().positive().max(1_000_000),
  duration_minutes: z.number().int().min(10).max(600),
  sort_order: z.number().int().min(0).optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const reorderServiceSchema = z.object({
  sort_order: z.number().int().min(0),
});
