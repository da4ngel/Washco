import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarCheck, Wallet, Star, Clock, ArrowRight, Sparkles, CalendarDays } from 'lucide-react';
import { getDashboard } from '@/services/dashboard.service';
import { useTenantBookingRealtime } from '@/hooks/useRealtime';
import { StatCard } from '@/components/shared/StatCard';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR, formatTime } from '@/lib/utils';

export function TenantDashboardPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['tenant', 'dashboard'], queryFn: getDashboard });
  useTenantBookingRealtime(data?.tenant.id);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Couldn't load your dashboard" description="Please try again shortly." />;
  }

  const { stats, next_booking: next, recent_bookings } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.tenant.business_name}</h1>
        <p className="text-sm text-muted-foreground">Here's how your business is doing today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bookings today" value={stats.bookings_today} icon={CalendarCheck} />
        <StatCard label="Earnings today" value={formatLKR(stats.earnings_today)} icon={Wallet} accent />
        <StatCard label="Pending payout" value={formatLKR(stats.pending_payout)} icon={Wallet} />
        <StatCard
          label="Rating"
          value={stats.rating.toFixed(1)}
          hint={`${stats.total_reviews} reviews`}
          icon={Star}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to="/tenant/schedule">
            <CalendarDays className="h-4 w-4" /> View schedule
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/tenant/services">
            <Sparkles className="h-4 w-4" /> Manage services
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/tenant/payouts">
            <Wallet className="h-4 w-4" /> View payouts
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next booking */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Next booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {next && next.slot ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{next.booking_ref}</p>
                <p className="font-semibold">{next.user?.full_name ?? 'Customer'}</p>
                <p className="text-sm">{next.service?.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(parseISO(next.slot.date), 'd MMM')} · {formatTime(next.slot.start_time)}
                </p>
                <BookingStatusBadge status={next.status} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent bookings</CardTitle>
            <Link to="/tenant/bookings" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              All <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recent_bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="divide-y">
                {recent_bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.user?.full_name ?? 'Customer'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.service?.name}
                        {b.slot ? ` · ${format(parseISO(b.slot.date), 'd MMM')} ${formatTime(b.slot.start_time)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatLKR(Number(b.tenant_payout))}</span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
