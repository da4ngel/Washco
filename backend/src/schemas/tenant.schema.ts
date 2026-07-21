import { z } from 'zod';

const numeric = (min?: number, max?: number) =>
  z.coerce.number().refine((n) => (min === undefined || n >= min) && (max === undefined || n <= max), 'Out of range');

export const searchTenantsSchema = z.object({
  q: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  lat: numeric().optional(),
  lng: numeric().optional(),
  radius: numeric(0, 100).optional(), // km
  min_rating: numeric(0, 5).optional(),
  max_price: numeric(0).optional(),
  available_today: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .optional(),
  sort: z.enum(['rating', 'distance', 'newest']).optional().default('rating'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});
export type SearchTenantsQuery = z.infer<typeof searchTenantsSchema>;

export const availabilitySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
  service_id: z.string().uuid().optional(),
});

export const addPhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional(),
  is_primary: z.boolean().optional(),
});

export const updateHoursSchema = z.object({
  hours: z
    .array(
      z.object({
        day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        open_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        close_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
        is_closed: z.boolean(),
      })
    )
    .min(1)
    .max(7),
});

export const updateTenantProfileSchema = z.object({
  business_name: z.string().min(2).max(160).optional(),
  description: z.string().max(1000).nullable().optional(),
  address: z.string().min(4).max(300).optional(),
  city: z.string().min(2).max(80).optional(),
  district: z.string().max(80).nullable().optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']).optional(),
});
