import { useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Phone, Camera, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { BookingStatusBadge } from './BookingStatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatLKR, formatTime } from '@/lib/utils';
import { uploadFile, objectPath } from '@/lib/storage';
import { transitionBooking, cancelBooking, uploadBookingPhotos } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/services/api';
import { Booking } from '@/types';

export function TenantBookingCard({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tenant', 'bookings'] });
    qc.invalidateQueries({ queryKey: ['tenant', 'dashboard'] });
  };

  const transition = useMutation({
    mutationFn: (action: 'confirm' | 'start' | 'complete') => transitionBooking(booking.id, action),
    onSuccess: () => {
      toast.success('Booking updated.');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const cancel = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: () => {
      toast.success('Booking cancelled.');
      setConfirmCancel(false);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const handleUpload = async (kind: 'before' | 'after', file: File) => {
    setUploading(kind);
    try {
      const url = await uploadFile('booking-photos', objectPath(booking.id, file), file);
      await uploadBookingPhotos(booking.id, kind === 'before' ? { before_photo_url: url } : { after_photo_url: url });
      toast.success(`${kind === 'before' ? 'Before' : 'After'} photo uploaded.`);
      invalidate();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Upload failed.'));
    } finally {
      setUploading(null);
    }
  };

  const canConfirm = booking.status === 'pending';
  const canStart = booking.status === 'confirmed';
  const canComplete = booking.status === 'in_progress';
  const canCancel = ['pending', 'confirmed', 'in_progress'].includes(booking.status);
  const canPhotos = ['in_progress', 'completed'].includes(booking.status);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={booking.user?.avatar_url ?? null} fallback={booking.user?.full_name ?? 'C'} />
            <div>
              <p className="font-semibold">{booking.user?.full_name ?? 'Customer'}</p>
              <p className="text-xs text-muted-foreground">{booking.booking_ref}</p>
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">{booking.service?.name}</span>
          <span className="text-right font-medium">{formatLKR(Number(booking.service_price))}</span>
          {booking.slot && (
            <span className="col-span-2 flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {format(parseISO(booking.slot.date), 'd MMM yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatTime(booking.slot.start_time)}
              </span>
            </span>
          )}
          {booking.user?.phone && (
            <span className="col-span-2 flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {booking.user.phone}
            </span>
          )}
          {booking.user_notes && (
            <p className="col-span-2 rounded-md bg-secondary p-2 text-xs">"{booking.user_notes}"</p>
          )}
        </div>

        {/* Photos */}
        {canPhotos && (
          <div className="flex gap-2">
            <input
              ref={beforeRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload('before', e.target.files[0])}
            />
            <input
              ref={afterRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload('after', e.target.files[0])}
            />
            <Button variant="outline" size="sm" className="flex-1" disabled={uploading === 'before'} onClick={() => beforeRef.current?.click()}>
              {uploading === 'before' ? <Loader2 className="h-4 w-4 animate-spin" /> : booking.before_photo_url ? <ImageIcon className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              Before
            </Button>
            <Button variant="outline" size="sm" className="flex-1" disabled={uploading === 'after'} onClick={() => afterRef.current?.click()}>
              {uploading === 'after' ? <Loader2 className="h-4 w-4 animate-spin" /> : booking.after_photo_url ? <ImageIcon className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              After
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate('confirm')}>
              Confirm
            </Button>
          )}
          {canStart && (
            <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate('start')}>
              Start wash
            </Button>
          )}
          {canComplete && (
            <Button size="sm" variant="accent" disabled={transition.isPending} onClick={() => transition.mutate('complete')}>
              Mark complete
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmCancel(true)}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this booking?"
        description="The customer will be notified and refunded if they have paid."
        confirmLabel="Cancel booking"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      />
    </Card>
  );
}
