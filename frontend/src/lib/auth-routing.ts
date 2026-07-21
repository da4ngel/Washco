import { Profile } from '@/types';

/** The landing route for a profile, by role. Used after any successful sign-in. */
export function destinationFor(profile: Profile): string {
  if (profile.role === 'admin') return '/admin';
  if (profile.role === 'tenant') return '/tenant/dashboard';
  return '/dashboard';
}
