import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api } from '@/services/api';
import { Profile } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<Profile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
}

/** Fetches the current user's profile from the API (source of truth for role). */
async function fetchProfile(): Promise<Profile | null> {
  try {
    const { data } = await api.get<{ profile: Profile }>('/auth/me');
    return data.profile;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  isAuthenticated: false,

  /** Loads the existing session (if any) and subscribes to auth changes. */
  initialize: async () => {
    set({ isLoading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let profile: Profile | null = null;
    if (session) {
      profile = await fetchProfile();
    }
    set({
      session,
      profile,
      isAuthenticated: Boolean(session && profile),
      isLoading: false,
      isInitialized: true,
    });

    // Keep the store in sync with Supabase auth events.
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const current = get().session;
      // Avoid redundant profile fetches on token refresh with same user.
      if (newSession?.user?.id && newSession.user.id === current?.user?.id) {
        set({ session: newSession });
        return;
      }
      if (newSession) {
        const p = await fetchProfile();
        set({ session: newSession, profile: p, isAuthenticated: Boolean(p) });
      } else {
        set({ session: null, profile: null, isAuthenticated: false });
      }
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await fetchProfile();
      if (!profile) throw new Error('Could not load your profile.');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, profile, isAuthenticated: true });
      return profile;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const profile = await fetchProfile();
    set({ profile, isAuthenticated: Boolean(profile) });
  },

  setProfile: (profile) => set({ profile }),
}));
