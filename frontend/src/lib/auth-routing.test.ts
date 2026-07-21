import { describe, it, expect } from 'vitest';
import { destinationFor } from './auth-routing';
import { Profile } from '@/types';

const profileWithRole = (role: Profile['role']): Profile =>
  ({ id: 'u1', full_name: 'Test User', role } as Profile);

describe('destinationFor', () => {
  it('routes admins to the admin console', () => {
    expect(destinationFor(profileWithRole('admin'))).toBe('/admin');
  });

  it('routes tenants to the tenant dashboard', () => {
    expect(destinationFor(profileWithRole('tenant'))).toBe('/tenant/dashboard');
  });

  it('routes customers to the user dashboard', () => {
    expect(destinationFor(profileWithRole('user'))).toBe('/dashboard');
  });
});
