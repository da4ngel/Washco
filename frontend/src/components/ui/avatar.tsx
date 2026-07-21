import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  className?: string;
}

/** Simple avatar: shows the image, or initials fallback if missing/broken. */
export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const initials = fallback
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground',
        className
      )}
    >
      {src && !errored ? (
        <img
          src={src}
          alt={alt ?? fallback}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
