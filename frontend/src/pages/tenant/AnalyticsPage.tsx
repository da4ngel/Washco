import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { CheckCircle2, XCircle, Repeat, Star, Trophy } from 'lucide-react';
import { getTenantAnalytics } from '@/services/analytics.service';
import { useChartColors } from '@/hooks/useChartColors';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR } from '@/lib/utils';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function AnalyticsPage() {
  const colors = useChartColors();
  const { data, isLoading } = useQuery({ queryKey: ['tenant', 'analytics'], queryFn: getTenantAnalytics });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return <EmptyState title="Couldn't load analytics" />;

  const { totals } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Completion rate" value={pct(totals.completion_rate)} icon={CheckCircle2} accent hint={`${totals.completed} of ${totals.total_bookings}`} />
        <StatCard label="Cancellation rate" value={pct(totals.cancellation_rate)} icon={XCircle} hint={`${totals.cancelled} cancelled`} />
        <StatCard label="Repeat customers" value={pct(totals.repeat_rate)} icon={Repeat} />
        <StatCard label="Rating" value={data.rating.toFixed(1)} icon={Star} hint={`${data.total_reviews} reviews`} />
      </div>

      {data.top_service && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-accent/15 p-2 text-accent">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top service</p>
              <p className="font-semibold">
                {data.top_service.name} <span className="text-muted-foreground">· {data.top_service.count} bookings</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue (your payout)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_series} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="payout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), 'd/M')} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={48} />
                <Tooltip
                  formatter={(v: number) => [formatLKR(v), 'Payout']}
                  labelFormatter={(d) => format(parseISO(d as string), 'd MMM')}
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="amount" stroke={colors.limeStroke} strokeWidth={2} fill="url(#payout)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Busiest days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.busiest_days} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                <Tooltip
                  formatter={(v: number) => [v, 'Bookings']}
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Bar dataKey="count" fill={colors.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
