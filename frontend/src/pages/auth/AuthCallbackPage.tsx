import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { destinationFor } from '@/lib/auth-routing';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

/**
 * OAuth landing page. Supabase (detectSessionInUrl) parses the token from the
 * URL, then we load the profile and route by role. Reached after Google sign-in.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const done = useRef(false);

  useEffect(() => {
    const finish = async () => {
      if (done.current) return;
      done.current = true;
      await refreshProfile();
      const profile = useAuthStore.getState().profile;
      if (profile) {
        toast.success(`Welcome, ${profile.full_name.split(' ')[0]}!`);
        navigate(destinationFor(profile), { replace: true });
      } else {
        toast.error('Could not complete sign-in. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    // The session may already be present, or arrive via detectSessionInUrl.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void finish();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finish();
    });

    // Fallback if no session materialises (user cancelled / bad redirect).
    const timeout = setTimeout(() => {
      if (!done.current) {
        toast.error('Sign-in timed out. Please try again.');
        navigate('/login', { replace: true });
      }
    }, 10000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40">
      <LoadingSpinner label="Signing you in…" />
    </div>
  );
}
