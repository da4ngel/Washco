import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, CalendarPlus, LayoutDashboard } from 'lucide-react';
import { useBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatLKR, formatTime } from '@/lib/utils';

/** Builds a Google Calendar "add event" URL for the booking. */
function calendarUrl(title: string, date: string, startTime: string, durationMin: number, details: string): string {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = useBooking(id);

  if (isLoading) return <LoadingSpinner fullPage label="Loading your booking…" />;
  if (!booking) {
    return (
      <div className="container py-10">
        <EmptyState title="Booking not found" />
      </div>
    );
  }

  const slot = booking.slot;
  const service = booking.service;
  const tenant = booking.tenant;

  return (
    <div className="container max-w-lg py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 rounded-full bg-accent/15 p-3">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Booking confirmed!</h1>
        <p className="mt-1 text-muted-foreground">
          Your booking reference is <span className="font-semibold text-foreground">{booking.booking_ref}</span>
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border bg-white p-3">
              <QRCodeSVG value={booking.booking_ref} size={140} />
            </div>
            <p className="text-xs text-muted-foreground">Show this QR code at the car wash</p>
          </div>

          <dl className="space-y-2 border-t pt-4 text-sm">
            {tenant && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Car wash</dt>
                <dd className="font-medium">{tenant.business_name}</dd>
              </div>
            )}
            {service && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service</dt>
                <dd className="font-medium">{service.name}</dd>
              </div>
            )}
            {slot && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">When</dt>
                <dd className="font-medium">
                  {format(parseISO(slot.date), 'd MMM yyyy')} · {formatTime(slot.start_time)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Paid</dt>
              <dd>{formatLKR(Number(booking.service_price))}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            {slot && service && tenant && (
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href={calendarUrl(
                    `Car wash — ${tenant.business_name}`,
                    slot.date,
                    slot.start_time,
                    service.duration_minutes,
                    `Booking ${booking.booking_ref}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarPlus className="h-4 w-4" /> Add to calendar
                </a>
              </Button>
            )}
            <Button className="flex-1" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" /> View my bookings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
