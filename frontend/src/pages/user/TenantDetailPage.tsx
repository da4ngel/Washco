import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Phone, ChevronLeft } from 'lucide-react';
import { useTenant, useTenantReviews } from '@/hooks/useTenants';
import { useBookingStore } from '@/store/bookingStore';
import { TenantGallery } from '@/components/tenant/TenantGallery';
import { RatingStars } from '@/components/tenant/RatingStars';
import { ReviewCard } from '@/components/tenant/ReviewCard';
import { TenantMap } from '@/components/maps/TenantMap';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatTime } from '@/lib/utils';
import { Service } from '@/types';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function TenantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading, isError } = useTenant(slug);
  const { data: reviews } = useTenantReviews(slug);
  const { setTenant, setService } = useBookingStore();

  if (isLoading) {
    return (
      <div className="container space-y-4 py-6">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="container py-10">
        <EmptyState title="Car wash not found" description="This listing may have been removed." />
      </div>
    );
  }

  const startBooking = (service?: Service) => {
    setTenant(tenant);
    if (service) setService(service);
    navigate(`/book/${tenant.id}`);
  };

  const orderedHours = [...tenant.operating_hours].sort(
    (a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)
  );

  const breakdown = reviews?.breakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalReviews = reviews?.total ?? tenant.total_reviews;

  return (
    <div className="container py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <TenantGallery photos={tenant.photos} name={tenant.business_name} />

          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{tenant.business_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{Number(tenant.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({tenant.total_reviews} reviews)</span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {tenant.address}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-4 w-4" /> {tenant.phone}
              </span>
            </div>
            {tenant.description && <p className="mt-4 text-foreground/90">{tenant.description}</p>}
          </div>

          {/* Services */}
          <section>
            <h2 className="mb-3 text-xl font-semibold">Services</h2>
            {tenant.services.length === 0 ? (
              <EmptyState title="No services listed yet" />
            ) : (
              <ServiceSelector
                services={tenant.services}
                onSelect={(s) => startBooking(s)}
              />
            )}
          </section>

          {/* Reviews */}
          <section>
            <h2 className="mb-3 text-xl font-semibold">Customer reviews</h2>
            {totalReviews === 0 ? (
              <EmptyState icon={Star} title="No reviews yet" description="Be the first to book and review." />
            ) : (
              <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                {/* Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{Number(tenant.rating).toFixed(1)}</span>
                    <div className="pb-1">
                      <RatingStars rating={Number(tenant.rating)} />
                      <p className="text-xs text-muted-foreground">{totalReviews} reviews</p>
                    </div>
                  </div>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = breakdown[star] ?? 0;
                    const pct = totalReviews ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-muted-foreground">{star}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
                {/* List */}
                <div className="space-y-3">
                  {(reviews?.data ?? tenant.recent_reviews).map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" size="lg" onClick={() => startBooking()}>
                Book now
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Free cancellation up to 2 hours before
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Opening hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {orderedHours.map((h) => (
                <div key={h.day_of_week} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{h.day_of_week}</span>
                  <span>
                    {h.is_closed ? 'Closed' : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <TenantMap
            lat={tenant.lat ? Number(tenant.lat) : null}
            lng={tenant.lng ? Number(tenant.lng) : null}
            name={tenant.business_name}
            address={tenant.address}
          />
        </aside>
      </div>
    </div>
  );
}
