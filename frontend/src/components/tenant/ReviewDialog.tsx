import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createReview } from '@/services/review.service';
import { getApiErrorMessage } from '@/services/api';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  tenantName?: string;
}

export function ReviewDialog({ open, onOpenChange, bookingId, tenantName }: ReviewDialogProps) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () => createReview({ booking_id: bookingId, rating, comment: comment || undefined }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      onOpenChange(false);
      setRating(0);
      setComment('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Leave a review</DialogTitle>
        <DialogDescription>{tenantName ? `How was your wash at ${tenantName}?` : 'How was your wash?'}</DialogDescription>
      </DialogHeader>

      <div className="flex justify-center gap-1 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} star`}
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                (hover || rating) >= i ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        placeholder="Share the details of your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button disabled={rating === 0 || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit review
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
