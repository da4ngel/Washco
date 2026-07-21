import { Link } from 'react-router-dom';
import { MapPin, Star, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatLKR } from '@/lib/utils';
import { TenantSearchResult } from '@/services/tenant.service';

interface TenantCardProps {
  tenant: TenantSearchResult;
}

export function TenantCard({ tenant }: TenantCardProps) {
  const primary =
    tenant.photos?.find((p) => p.is_primary)?.url ?? tenant.photos?.[0]?.url ?? null;

  return (
    <Link
      to={`/wash/${tenant.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {primary ? (
          <img
            src={primary}
            alt={tenant.business_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-black text-muted-foreground/20">
            {tenant.business_name.slice(0, 1)}
          </div>
        )}
        {tenant.is_featured && (
          <Badge variant="accent" className="absolute left-2 top-2 shadow">
            Featured
          </Badge>
        )}
        {tenant.distance_km !== undefined && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            <Navigation className="h-3 w-3" /> {tenant.distance_km} km
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{tenant.business_name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {Number(tenant.rating).toFixed(1)}
            <span className="text-muted-foreground">({tenant.total_reviews})</span>
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {tenant.district ?? tenant.city}
        </p>
        <div className="mt-auto pt-3">
          {tenant.starting_price != null ? (
            <p className="text-sm text-muted-foreground">
              From <span className="font-semibold text-foreground">{formatLKR(tenant.starting_price)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">View services</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TenantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
