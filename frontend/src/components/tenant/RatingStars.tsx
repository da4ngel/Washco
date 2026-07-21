import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

/** Renders 5 stars with partial fill for the given rating (0–5). */
export function RatingStars({ rating, size = 16, className, showValue }: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty';
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-muted-foreground/30" />
            {fill !== 'empty' && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: fill === 'half' ? size / 2 : size }}
              >
                <Star size={size} className="fill-yellow-400 text-yellow-400" />
              </span>
            )}
          </span>
        );
      })}
      {showValue && <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>}
    </div>
  );
}
