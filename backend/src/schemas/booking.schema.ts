import { z } from 'zod';

export const createBookingSchema = z.object({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  user_notes: z.string().max(500).optional(),
});
export type CreateBookingBody = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const listBookingsSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .optional(),
  scope: z.enum(['upcoming', 'past', 'all']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const bookingPhotosSchema = z.object({
  before_photo_url: z.string().url().optional(),
  after_photo_url: z.string().url().optional(),
});
