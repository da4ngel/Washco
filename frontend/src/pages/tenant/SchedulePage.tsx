import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarPlus, Clock, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMyTenant, generateSlots, blockSlot, unblockSlot, updateHours } from '@/services/dashboard.service';
import { getTenantAvailability } from '@/services/tenant.service';
import { getApiErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatTime } from '@/lib/utils';
import { DayOfWeek, OperatingHour, TimeSlot } from '@/types';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function SchedulePage() {
  const qc = useQueryClient();
  const { data: tenant, isLoading: loadingTenant } = useQuery({ queryKey: ['tenant', 'me'], queryFn: getMyTenant });

  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['schedule', tenant?.id, from, to],
    queryFn: () => getTenantAvailability(tenant!.id, from, to),
    enabled: Boolean(tenant?.id),
  });

  const [hoursOpen, setHoursOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['schedule'] });

  const generate = useMutation({
    mutationFn: () => generateSlots(30, 1, false),
    onSuccess: (n) => {
      toast.success(`Generated slots (${n} candidates).`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: (slot: TimeSlot) => (slot.is_blocked ? unblockSlot(slot.id) : blockSlot(slot.id)),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const byDate = new Map<string, TimeSlot[]>();
  for (const s of slots ?? []) {
    const list = byDate.get(s.date) ?? [];
    list.push(s);
    byDate.set(s.date, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHoursOpen(true)}>
            <Settings2 className="h-4 w-4" /> Operating hours
          </Button>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
            Generate slots
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <Legend className="bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" label="Available" />
        <Legend className="bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" label="Booked" />
        <Legend className="bg-muted text-muted-foreground" label="Blocked" />
      </div>

      {loadingTenant || loadingSlots ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (slots?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Clock}
          title="No slots yet"
          description="Generate slots from your operating hours to start taking bookings."
          action={<Button onClick={() => generate.mutate()}>Generate slots</Button>}
        />
      ) : (
        <div className="space-y-4">
          {Array.from(byDate.entries()).map(([date, daySlots]) => (
            <Card key={date}>
              <CardContent className="p-4">
                <p className="mb-3 font-semibold">{format(parseISO(date), 'EEEE, d MMM')}</p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const booked = slot.booked_count > 0;
                    const state = booked ? 'booked' : slot.is_blocked ? 'blocked' : 'available';
                    return (
                      <button
                        key={slot.id}
                        disabled={booked}
                        onClick={() => toggle.mutate(slot)}
                        title={booked ? 'Booked — cannot change' : slot.is_blocked ? 'Click to unblock' : 'Click to block'}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity',
                          state === 'available' && 'bg-green-100 text-green-800 hover:opacity-80 dark:bg-green-500/15 dark:text-green-300',
                          state === 'booked' && 'cursor-not-allowed bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
                          state === 'blocked' && 'bg-muted text-muted-foreground line-through hover:opacity-80'
                        )}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tenant && (
        <OperatingHoursDialog
          open={hoursOpen}
          onOpenChange={setHoursOpen}
          hours={tenant.operating_hours}
          onSaved={() => {
            setHoursOpen(false);
            qc.invalidateQueries({ queryKey: ['tenant', 'me'] });
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', className)} /> {label}
    </span>
  );
}

function OperatingHoursDialog({
  open,
  onOpenChange,
  hours,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hours: OperatingHour[];
  onSaved: () => void;
}) {
  const initial = DAYS.map((day) => {
    const existing = hours.find((h) => h.day_of_week === day);
    return {
      day_of_week: day,
      open_time: existing?.open_time?.slice(0, 5) ?? '08:00',
      close_time: existing?.close_time?.slice(0, 5) ?? '18:00',
      is_closed: existing?.is_closed ?? false,
    };
  });
  const [rows, setRows] = useState(initial);

  const save = useMutation({
    mutationFn: () => updateHours(rows),
    onSuccess: () => {
      toast.success('Operating hours updated. Slots regenerated.');
      onSaved();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Operating hours</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.day_of_week} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-2 sm:w-32 sm:justify-start">
              <span className="text-sm capitalize">{r.day_of_week}</span>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!r.is_closed}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...r, is_closed: !e.target.checked };
                    setRows(next);
                  }}
                />
                Open
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={r.open_time}
                disabled={r.is_closed}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, open_time: e.target.value };
                  setRows(next);
                }}
                className="h-8 flex-1"
              />
              <Input
                type="time"
                value={r.close_time}
                disabled={r.is_closed}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...r, close_time: e.target.value };
                  setRows(next);
                }}
                className="h-8 flex-1"
              />
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
