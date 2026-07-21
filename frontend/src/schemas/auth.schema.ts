import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name is too short').max(120),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .max(20)
      .regex(/^[+\d][\d\s-]+$/, 'Invalid phone number'),
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type RegisterForm = z.infer<typeof registerSchema>;

export const tenantRegisterSchema = z
  .object({
    full_name: z.string().min(2).max(120),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(7).max(20),
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm_password: z.string(),
    business_name: z.string().min(2, 'Business name is required').max(160),
    description: z.string().max(1000).optional(),
    address: z.string().min(4, 'Address is required').max(300),
    city: z.string().min(2).max(80).default('Colombo'),
    district: z.string().max(80).optional(),
    business_phone: z.string().min(7, 'Enter a valid phone number').max(20),
    business_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type TenantRegisterForm = z.infer<typeof tenantRegisterSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
