import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Users, Building2, CalendarCheck, TrendingUp, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getAdminDashboard } from '@/services/admin.service';
import { useAdminBookingRealtime } from '@/hooks/useRealtime';
import { useChartColors } from '@/hooks/useChartColors';
import { StatCard } from '@/components/shared/StatCard';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR } from '@/lib/utils';

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard });
  const colors = useChartColors();
  useAdminBookingRealtime(true);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return <EmptyState title="Couldn't load dashboard" />;

  const { stats } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform overview</h1>

      {stats.pending_tenants > 0 && (
        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-500/30 dark:bg-yellow-500/10">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm">
                <span className="font-semibold">{stats.pending_tenants}</span> tenant
                {stats.pending_tenants > 1 ? 's' : ''} awaiting approval
              </p>
            </div>
            <Button size="sm" asChild>
              <Link to="/admin/tenants">Review</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.total_users} icon={Users} />
        <StatCard label="Active tenants" value={stats.active_tenants} icon={Building2} />
        <StatCard label="Bookings today" value={stats.bookings_today} icon={CalendarCheck} />
        <StatCard label="MRR" value={formatLKR(stats.mrr)} icon={TrendingUp} accent />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission revenue (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_series} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(parseISO(d), 'd/M')}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={48} />
                <Tooltip
                  formatter={(v: number) => [formatLKR(v), 'Commission']}
                  labelFormatter={(d) => format(parseISO(d as string), 'd MMM yyyy')}
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="amount" stroke={colors.limeStroke} strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="divide-y">
              {data.recent_bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.tenant?.business_name ?? 'Car wash'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.booking_ref} · {b.service?.name}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
