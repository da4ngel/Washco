import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import { getTenantBookings } from '@/services/dashboard.service';
import { TenantBookingCard } from '@/components/booking/TenantBookingCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookingStatus } from '@/types';

const TABS: { value: string; label: string; status?: BookingStatus }[] = [
  { value: 'pending', label: 'Pending', status: 'pending' },
  { value: 'confirmed', label: 'Upcoming', status: 'confirmed' },
  { value: 'in_progress', label: 'In progress', status: 'in_progress' },
  { value: 'completed', label: 'Completed', status: 'completed' },
  { value: 'cancelled', label: 'Cancelled', status: 'cancelled' },
];

export function BookingsPage() {
  const [tab, setTab] = useState('pending');
  const active = TABS.find((t) => t.value === tab);

  const { data, isLoading } = useQuery({
    queryKey: ['tenant', 'bookings', active?.status],
    queryFn: () => getTenantBookings({ status: active?.status, limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bookings</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto no-scrollbar">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : (data?.data.length ?? 0) === 0 ? (
              <EmptyState icon={CalendarX} title={`No ${t.label.toLowerCase()} bookings`} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data?.data.map((b) => (
                  <TenantBookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
