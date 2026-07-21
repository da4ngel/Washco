import { format, parseISO, isSameDay } from 'date-fns';
import { cn, formatTime } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { EmptyState } from '@/components/shared/EmptyState';
import { CalendarX } from 'lucide-react';

interface TimeSlotPickerProps {
  dates: string[]; // available dates (YYYY-MM-DD)
  slotsForDate: TimeSlot[];
  selectedDate: string | null;
  selectedSlotId?: string;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
}

export function TimeSlotPicker({
  dates,
  slotsForDate,
  selectedDate,
  selectedSlotId,
  onSelectDate,
  onSelectSlot,
}: TimeSlotPickerProps) {
  if (dates.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No availability"
        description="This car wash has no open slots in the selected range. Try again later."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {dates.map((d) => {
          const date = parseISO(d);
          const active = selectedDate === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDate(d)}
              className={cn(
                'flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/40'
              )}
            >
              <span className="text-xs uppercase">{format(date, 'EEE')}</span>
              <span className="text-lg font-bold leading-tight">{format(date, 'd')}</span>
              <span className="text-xs">{format(date, 'MMM')}</span>
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {selectedDate ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slotsForDate.map((slot) => {
            const disabled = !slot.available;
            const active = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  'rounded-lg border py-2 text-sm font-medium transition-colors',
                  disabled && 'cursor-not-allowed bg-muted text-muted-foreground/50 line-through',
                  !disabled && active && 'border-primary bg-primary text-primary-foreground',
                  !disabled && !active && 'hover:border-primary hover:text-primary'
                )}
              >
                {formatTime(slot.start_time)}
              </button>
            );
          })}
          {slotsForDate.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">No slots for this day.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick a date to see available times.</p>
      )}
    </div>
  );
}

/** Small helper re-export to avoid importing date-fns everywhere. */
export function isToday(dateStr: string): boolean {
  return isSameDay(parseISO(dateStr), new Date());
}
