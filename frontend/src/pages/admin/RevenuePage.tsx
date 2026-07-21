import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRevenue, calculatePayouts, processPayouts } from '@/services/admin.service';
import { useChartColors } from '@/hooks/useChartColors';
import { getApiErrorMessage } from '@/services/api';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatLKR } from '@/lib/utils';

type Period = 'day' | 'week' | 'month';

export function RevenuePage() {
  const qc = useQueryClient();
  const colors = useChartColors();
  const [period, setPeriod] = useState<Period>('day');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'revenue', period], queryFn: () => getRevenue(period) });

  const calc = useMutation({
    mutationFn: calculatePayouts,
    onSuccess: (n) => {
      toast.success(`Calculated payouts for ${n} tenant(s).`);
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const process = useMutation({
    mutationFn: processPayouts,
    onSuccess: () => toast.success('Pending payouts marked as processed.'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <div className="flex rounded-lg border p-0.5">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn('rounded-md px-3 py-1 text-sm capitalize', period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data ? (
        <EmptyState title="Couldn't load revenue" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Commission earned" value={formatLKR(data.total_commission)} icon={DollarSign} accent />
            <StatCard label="Gross merchandise value" value={formatLKR(data.total_gmv)} icon={TrendingUp} />
            <StatCard label="Paid bookings" value={data.total_bookings} icon={ShoppingBag} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission by {period}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series} margin={{ left: -12, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={52} />
                    <Tooltip
                      formatter={(v: number) => [formatLKR(v), 'Commission']}
                      contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Bar dataKey="commission" fill={colors.navy} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenant payouts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm text-muted-foreground">
                Calculate pending payouts for the current period, then mark them as processed once paid out.
              </p>
              <Button variant="outline" disabled={calc.isPending} onClick={() => calc.mutate()}>
                {calc.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Calculate payouts
              </Button>
              <Button disabled={process.isPending} onClick={() => process.mutate()}>
                {process.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Process payouts
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
