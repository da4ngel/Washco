import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Service-role Supabase client. This bypasses Row Level Security and must
 * NEVER be exposed to the frontend. All backend data access goes through here.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseServiceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Anon client used only to verify a caller's JWT (auth.getUser). It respects
 * RLS and carries no elevated privileges.
 */
export const supabaseAuth: SupabaseClient = createClient(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
