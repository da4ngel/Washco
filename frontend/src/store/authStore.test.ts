import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Profile } from '@/types';

// Mock the Supabase client and API before importing the store. The mock fns are
// created via vi.hoisted so they exist when the hoisted vi.mock factories run.
const { signInWithPassword, getSession, signOut, onAuthStateChange, apiGet } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
  apiGet: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword, getSession, signOut, onAuthStateChange },
  },
}));

vi.mock('@/services/api', () => ({
  api: { get: apiGet },
}));

import { useAuthStore } from './authStore';

const customer: Profile = {
  id: 'u1',
  full_name: 'Nimal Perera',
  phone: null,
  avatar_url: null,
  role: 'user',
  is_active: true,
  created_at: '',
  updated_at: '',
};

const fakeSession = { user: { id: 'u1' } };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ session: null, profile: null, isAuthenticated: false, isLoading: false });
});

describe('authStore.login', () => {
  it('signs in, loads the profile, and marks the user authenticated', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    apiGet.mockResolvedValue({ data: { profile: customer } });
    getSession.mockResolvedValue({ data: { session: fakeSession } });

    const returned = await useAuthStore.getState().login('nimal@example.com', 'Password123!');

    expect(returned).toEqual(customer);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profile).toEqual(customer);
    expect(state.isLoading).toBe(false);
  });

  it('throws and resets loading when credentials are rejected', async () => {
    signInWithPassword.mockResolvedValue({ error: new Error('Invalid login') });

    await expect(useAuthStore.getState().login('x@y.com', 'bad')).rejects.toThrow('Invalid login');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

describe('authStore.logout', () => {
  it('signs out and clears session + profile', async () => {
    useAuthStore.setState({ session: fakeSession as never, profile: customer, isAuthenticated: true });
    signOut.mockResolvedValue({ error: null });

    await useAuthStore.getState().logout();

    expect(signOut).toHaveBeenCalledOnce();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
