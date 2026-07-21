import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Tenant dashboard realtime: new bookings (INSERT) and status changes (UPDATE)
 * for the given tenant. Shows a toast on new bookings and refreshes queries.
 */
export function useTenantBookingRealtime(tenantId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tenantId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`tenant-bookings-${tenantId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` },
        () => {
          toast.success('New booking received!');
          qc.invalidateQueries({ queryKey: ['tenant', 'dashboard'] });
          qc.invalidateQueries({ queryKey: ['tenant', 'bookings'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `tenant_id=eq.${tenantId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['tenant', 'dashboard'] });
          qc.invalidateQueries({ queryKey: ['tenant', 'bookings'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, qc]);
}

/**
 * User realtime: their booking status changes (UPDATE) refresh the dashboard
 * and surface a toast so the status badge updates live.
 */
export function useUserBookingRealtime(userId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`user-bookings-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['my-bookings'] });
          qc.invalidateQueries({ queryKey: ['booking'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}

/** New notifications (INSERT) for the user: toast + refresh the bell. */
export function useNotificationRealtime(userId: string | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as { title?: string };
          if (n.title) toast(n.title);
          qc.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}

/** Admin dashboard realtime: any new booking refreshes the live counters. */
export function useAdminBookingRealtime(enabled: boolean): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;

    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}
