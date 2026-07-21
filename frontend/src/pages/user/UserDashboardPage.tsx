import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Clock, Star, MapPin, Car, Ticket } from 'lucide-react';
import { getMyBookings, getWashPasses } from '@/services/user.service';
import { useUserBookingRealtime } from '@/hooks/useRealtime';
import { useAuthStore } from '@/store/authStore';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { ReviewDialog } from '@/components/tenant/ReviewDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR, formatTime } from '@/lib/utils';
import { Booking } from '@/types';

export function UserDashboardPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [review, setReview] = useState<Booking | null>(null);
  const userId = useAuthStore((s) => s.session?.user?.id);
  useUserBookingRealtime(userId);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', tab],
    queryFn: () => getMyBookings({ scope: tab, limit: 50 }),
  });
  const { data: passes } = useQuery({ queryKey: ['wash-passes'], queryFn: getWashPasses });

  const bookings = data?.data ?? [];

  return (
    <div className="container py-6">
      <h1 className="mb-1 text-2xl font-bold">My bookings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your upcoming and past car washes.</p>

      {/* Active wash pass */}
      {passes && passes.length > 0 && (
        <Card className="mb-6 border-accent/40 bg-accent/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-accent/15 p-2 text-accent">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{passes[0].plan_name}</p>
              <p className="text-sm text-muted-foreground">
                {passes[0].total_washes - passes[0].used_washes} of {passes[0].total_washes} washes remaining
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'upcoming' | 'past')}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Car}
              title={tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              description={tab === 'upcoming' ? 'Book your next wash to see it here.' : undefined}
              action={
                tab === 'upcoming' ? (
                  <Button asChild>
                    <Link to="/search">Find a wash</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{b.tenant?.business_name ?? 'Car wash'}</p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{b.service?.name}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {b.slot && (
                          <>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" /> {format(parseISO(b.slot.date), 'd MMM yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {formatTime(b.slot.start_time)}
                            </span>
                          </>
                        )}
                        {b.tenant?.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {b.tenant.address}
                          </span>
                        )}
                        <span className="font-medium text-foreground">{b.booking_ref}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatLKR(Number(b.service_price))}</span>
                      {b.status === 'completed' && !b.review && (
                        <Button size="sm" variant="accent" onClick={() => setReview(b)}>
                          <Star className="h-4 w-4" /> Review
                        </Button>
                      )}
                      {b.tenant?.slug && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/wash/${b.tenant.slug}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {review && (
        <ReviewDialog
          open={Boolean(review)}
          onOpenChange={(v) => !v && setReview(null)}
          bookingId={review.id}
          tenantName={review.tenant?.business_name}
        />
      )}
    </div>
  );
}
