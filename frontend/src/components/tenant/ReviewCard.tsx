import { format } from 'date-fns';
import { CornerDownRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { RatingStars } from './RatingStars';
import { Review } from '@/types';

export function ReviewCard({ review }: { review: Review }) {
  const name = review.user?.full_name ?? 'Customer';
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={review.user?.avatar_url ?? null} fallback={name} className="h-9 w-9" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{name}</p>
            <time className="text-xs text-muted-foreground">
              {format(new Date(review.created_at), 'd MMM yyyy')}
            </time>
          </div>
          <RatingStars rating={review.rating} size={14} className="mt-0.5" />
          {review.comment && <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>}
          {review.tenant_reply && (
            <div className="mt-3 flex gap-2 rounded-lg bg-secondary p-3 text-sm">
              <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Owner reply</p>
                <p className="mt-0.5">{review.tenant_reply}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
