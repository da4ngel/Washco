import { MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantMapProps {
  lat: number | null;
  lng: number | null;
  name: string;
  address?: string;
  className?: string;
  zoom?: number;
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Location map for a single car wash. Uses the Google Maps Embed API when a key
 * is configured; otherwise falls back to an address card with a maps link.
 */
export function TenantMap({ lat, lng, name, address, className, zoom = 15 }: TenantMapProps) {
  const hasCoords = lat !== null && lng !== null;
  const mapsLink = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? name)}`;

  if (MAPS_KEY && hasCoords) {
    const src = `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${lat},${lng}&zoom=${zoom}`;
    return (
      <div className={cn('overflow-hidden rounded-xl border', className)}>
        <iframe
          title={`Map showing ${name}`}
          src={src}
          className="h-full min-h-[220px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  // Fallback (no API key or no coordinates).
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border bg-secondary/40 p-6 text-center',
        className
      )}
    >
      <div className="rounded-full bg-background p-3">
        <MapPin className="h-6 w-6 text-primary" />
      </div>
      <p className="font-medium">{name}</p>
      {address && <p className="text-sm text-muted-foreground">{address}</p>}
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
