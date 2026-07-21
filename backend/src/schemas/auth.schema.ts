import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name is too short').max(120),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+\d][\d\s-]+$/, 'Invalid phone number')
    .optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const tenantRegisterSchema = z.object({
  // Owner account
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().min(7).max(20),
  // Business
  business_name: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  address: z.string().min(4).max(300),
  city: z.string().min(2).max(80).default('Colombo'),
  district: z.string().max(80).optional(),
  business_phone: z.string().min(7).max(20),
  business_email: z.string().email().optional(),
});
export type TenantRegisterInput = z.infer<typeof tenantRegisterSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  access_token: z.string().min(1),
  password: z.string().min(8).max(72),
});
