import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Wallet, TrendingUp, Receipt } from 'lucide-react';
import { getPayouts } from '@/services/dashboard.service';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR } from '@/lib/utils';

export function PayoutsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['tenant', 'payouts'], queryFn: getPayouts });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return <EmptyState title="Couldn't load payouts" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending payout" value={formatLKR(data.pending_amount)} icon={Wallet} accent hint={`${data.completed_count} completed washes`} />
        <StatCard label="Gross earnings" value={formatLKR(data.gross_earnings)} icon={TrendingUp} />
        <StatCard label="Platform commission" value={formatLKR(data.total_commission)} icon={Receipt} hint={`${data.commission_rate}% per booking`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How payouts work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            WashCo takes a <span className="font-medium text-foreground">{data.commission_rate}%</span> commission on each
            completed booking. The remaining amount is your payout. Pending earnings are paid out at the end of each
            payout period.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts have been processed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Period</th>
                    <th className="py-2 font-medium">Bookings</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">
                        {format(parseISO(p.period_start), 'd MMM')} – {format(parseISO(p.period_end), 'd MMM yyyy')}
                      </td>
                      <td className="py-2">{p.booking_count}</td>
                      <td className="py-2 font-medium">{formatLKR(Number(p.amount))}</td>
                      <td className="py-2">
                        <Badge variant={p.status === 'completed' ? 'completed' : 'pending'}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
