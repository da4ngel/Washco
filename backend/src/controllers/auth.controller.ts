import { Request, Response } from 'express';
import { supabaseAdmin, supabaseAuth } from '../config/supabase';
import { asyncHandler, slugify } from '../utils/helpers';
import { BadRequestError, ConflictError, UnauthorizedError, ServiceUnavailableError } from '../utils/errors';
import { isConfigured } from '../config/env';
import { logger } from '../config/logger';
import {
  RegisterInput,
  TenantRegisterInput,
  LoginInput,
} from '../schemas/auth.schema';
import { DayOfWeek } from '../types';

const DEFAULT_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function assertConfigured(): void {
  if (!isConfigured.supabase) {
    throw new ServiceUnavailableError('Supabase is not configured on the server.');
  }
}

/** Ensures a slug is unique by appending a short suffix if needed. */
async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base) || 'car-wash';
  const { data } = await supabaseAdmin.from('tenants').select('id').eq('slug', slug).maybeSingle();
  if (!data) return slug;
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

/** POST /api/auth/register — create a customer account. */
export const register = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const { full_name, email, password, phone } = req.body as RegisterInput;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm in this build; swap to email verification in prod
    user_metadata: { full_name, phone: phone ?? null, role: 'user' },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      throw new ConflictError('An account with this email already exists.');
    }
    throw new BadRequestError(error.message);
  }

  res.status(201).json({ message: 'Account created', user_id: data.user?.id });
});

/** POST /api/auth/register/tenant — create a tenant owner account + business. */
export const registerTenant = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const body = req.body as TenantRegisterInput;

  // 1. Create the owner auth user with the 'tenant' role.
  const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name, phone: body.phone, role: 'tenant' },
  });

  if (userError) {
    if (userError.message.toLowerCase().includes('already')) {
      throw new ConflictError('An account with this email already exists.');
    }
    throw new BadRequestError(userError.message);
  }

  const ownerId = created.user?.id;
  if (!ownerId) throw new BadRequestError('Failed to create owner account.');

  // 2. Create the tenant (pending approval).
  const slug = await uniqueSlug(body.business_name);
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      owner_id: ownerId,
      business_name: body.business_name,
      slug,
      description: body.description ?? null,
      address: body.address,
      city: body.city ?? 'Colombo',
      district: body.district ?? null,
      phone: body.business_phone,
      email: body.business_email ?? body.email,
      status: 'pending',
    })
    .select('*')
    .single();

  if (tenantError || !tenant) {
    // Roll back the created user so they can retry cleanly.
    await supabaseAdmin.auth.admin.deleteUser(ownerId).catch(() => undefined);
    throw new BadRequestError(tenantError?.message ?? 'Failed to create business.');
  }

  // 3. Seed default operating hours (Mon–Sat 08:00–18:00, Sun closed).
  const hoursRows = DEFAULT_DAYS.map((day) => ({
    tenant_id: tenant.id,
    day_of_week: day,
    open_time: '08:00',
    close_time: '18:00',
    is_closed: day === 'sunday',
  }));
  await supabaseAdmin.from('operating_hours').insert(hoursRows);

  logger.info(`New tenant registered: ${body.business_name} (${tenant.id})`);
  res.status(201).json({ message: 'Business registered and pending approval', tenant });
});

/** POST /api/auth/login — sign in, returning the Supabase session. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const { email, password } = req.body as LoginInput;

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  res.json({ session: data.session, profile });
});

/** POST /api/auth/logout — best-effort sign out (session lives client-side). */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

/** POST /api/auth/refresh — exchange a refresh token for a new session. */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const { refresh_token } = req.body as { refresh_token: string };
  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });
  if (error || !data.session) {
    throw new UnauthorizedError('Could not refresh session.');
  }
  res.json({ session: data.session });
});

/** POST /api/auth/forgot-password — send a reset email. */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const { email } = req.body as { email: string };
  // Do not reveal whether the email exists.
  await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CORS_ORIGIN ?? 'http://localhost:5173'}/reset-password`,
  });
  res.json({ message: 'If an account exists, a reset email has been sent.' });
});

/** POST /api/auth/reset-password — set a new password using a recovery token. */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  assertConfigured();
  const { access_token, password } = req.body as { access_token: string; password: string };

  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(access_token);
  if (userErr || !userData.user) {
    throw new UnauthorizedError('Invalid or expired reset token.');
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, { password });
  if (error) throw new BadRequestError(error.message);

  res.json({ message: 'Password updated. You can now log in.' });
});

/** GET /api/auth/me — current authenticated user + profile. */
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  res.json({ user: { id: req.user.id, email: req.user.email }, profile: req.user.profile });
});
