import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+\d][\d\s-]+$/, 'Invalid phone number')
    .nullable()
    .optional(),
  avatar_url: z.string().url().nullable().optional(),
});
