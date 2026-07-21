import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types';

const LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={status}>{LABELS[status]}</Badge>;
}
