import { Request, Response, NextFunction } from 'express';
import { supabaseAuth, supabaseAdmin } from '../config/supabase';
import { UnauthorizedError } from '../utils/errors';
import { Profile, AuthUser } from '../types';

/**
 * Verifies the Supabase JWT from the Authorization header, loads the user's
 * profile (with role), and attaches it to req.user.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Fetch full profile with role (service-role client, bypasses RLS).
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile) {
      throw new UnauthorizedError('Profile not found');
    }

    if (!profile.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    req.user = { ...user, profile } as AuthUser;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication: attaches req.user if a valid token is present,
 * but never rejects the request. Used for public endpoints that personalise
 * responses when a user happens to be logged in.
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single<Profile>();
      if (profile) {
        req.user = { ...user, profile } as AuthUser;
      }
    }
  } catch {
    // ignore — this is best-effort
  }
  next();
};
