import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Map as MapIcon, LayoutGrid, Star } from 'lucide-react';
import { useTenantSearch } from '@/hooks/useTenants';
import { TenantCard, TenantCardSkeleton } from '@/components/tenant/TenantCard';
import { TenantMap } from '@/components/maps/TenantMap';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TenantSearchParams } from '@/services/tenant.service';

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '3★ & up', value: '3' },
  { label: '4★ & up', value: '4' },
  { label: '4.5★ & up', value: '4.5' },
];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [text, setText] = useState(params.get('q') ?? '');

  const query: TenantSearchParams = useMemo(
    () => ({
      q: params.get('q') || undefined,
      min_rating: params.get('min_rating') ? Number(params.get('min_rating')) : undefined,
      max_price: params.get('max_price') ? Number(params.get('max_price')) : undefined,
      sort: (params.get('sort') as TenantSearchParams['sort']) || 'rating',
      page: params.get('page') ? Number(params.get('page')) : 1,
      limit: 12,
    }),
    [params]
  );

  const { data, isLoading, isError } = useTenantSearch(query);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('q', text.trim());
  };

  const results = data?.data ?? [];

  return (
    <div className="container py-6">
      {/* Search bar */}
      <form onSubmit={onSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by area or business name"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>
          <div className="space-y-1.5">
            <Label>Minimum rating</Label>
            <Select value={params.get('min_rating') ?? ''} onChange={(e) => setParam('min_rating', e.target.value)}>
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Max price (LKR)</Label>
            <Input
              type="number"
              min={0}
              step={500}
              placeholder="e.g. 3000"
              defaultValue={params.get('max_price') ?? ''}
              onBlur={(e) => setParam('max_price', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sort by</Label>
            <Select value={params.get('sort') ?? 'rating'} onChange={(e) => setParam('sort', e.target.value)}>
              <option value="rating">Top rated</option>
              <option value="newest">Newest</option>
            </Select>
          </div>
        </aside>

        {/* Results */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Searching…' : `${data?.total ?? 0} car washes found`}
            </p>
            <div className="flex rounded-lg border p-0.5">
              <button
                onClick={() => setView('grid')}
                className={cn('rounded-md p-1.5', view === 'grid' && 'bg-secondary')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('map')}
                className={cn('rounded-md p-1.5', view === 'map' && 'bg-secondary')}
                aria-label="Map view"
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isError ? (
            <EmptyState title="Couldn't load results" description="Please try again in a moment." />
          ) : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TenantCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No car washes match"
              description="Try widening your filters or searching a different area."
            />
          ) : view === 'map' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <TenantMap
                lat={results[0].lat ? Number(results[0].lat) : 6.9271}
                lng={results[0].lng ? Number(results[0].lng) : 79.8612}
                name="Colombo"
                address="Colombo, Sri Lanka"
                zoom={12}
                className="h-full min-h-[320px] md:sticky md:top-20"
              />
              <div className="grid gap-4">
                {results.map((t) => (
                  <TenantCard key={t.id} tenant={t} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((t) => (
                <TenantCard key={t.id} tenant={t} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(query.page ?? 1) <= 1}
                onClick={() => setParam('page', String((query.page ?? 1) - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(query.page ?? 1) >= data.totalPages}
                onClick={() => setParam('page', String((query.page ?? 1) + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
