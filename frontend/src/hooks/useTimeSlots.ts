import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTenantAvailability } from '@/services/tenant.service';
import { TimeSlot } from '@/types';

/** Fetches availability for a tenant across a date range and groups it by date. */
export function useAvailability(tenantId: string | undefined, from: string, to?: string) {
  const query = useQuery({
    queryKey: ['availability', tenantId, from, to],
    queryFn: () => getTenantAvailability(tenantId as string, from, to),
    enabled: Boolean(tenantId),
  });

  const byDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const slot of query.data ?? []) {
      const list = map.get(slot.date) ?? [];
      list.push(slot);
      map.set(slot.date, list);
    }
    return map;
  }, [query.data]);

  const availableDates = useMemo(
    () => Array.from(byDate.entries()).filter(([, slots]) => slots.some((s) => s.available)).map(([d]) => d),
    [byDate]
  );

  return { ...query, byDate, availableDates };
}
