import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  CalendarCheck,
  Car,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantSearch } from '@/hooks/useTenants';
import { TenantCard, TenantCardSkeleton } from '@/components/tenant/TenantCard';
import { RatingStars } from '@/components/tenant/RatingStars';
import { WaveDivider } from '@/components/shared/WaveDivider';
import { cn } from '@/lib/utils';

/** Pill CTA with the reference's small detached square to its right. */
function SquareCta({
  children,
  onClick,
  to,
  tone = 'accent',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  tone?: 'accent' | 'light';
}) {
  const square = tone === 'accent' ? 'bg-accent' : 'bg-white';
  const btn =
    tone === 'accent' ? (
      <Button shape="pill" variant="accent" size="lg" onClick={onClick} asChild={!!to}>
        {to ? <Link to={to}>{children}</Link> : children}
      </Button>
    ) : (
      <Button
        shape="pill"
        size="lg"
        onClick={onClick}
        asChild={!!to}
        className="bg-white text-navy-900 hover:bg-white/90"
      >
        {to ? <Link to={to}>{children}</Link> : children}
      </Button>
    );
  return (
    <span className="inline-flex items-center gap-2">
      {btn}
      <span className={cn('h-11 w-4 rounded-lg', square)} aria-hidden />
    </span>
  );
}

const TESTIMONIALS = [
  {
    quote:
      'Booked a wash on my lunch break and it was spotless by the time I got back. So much faster than my old spot.',
    name: 'Leslie Alexander',
    role: 'Regular customer',
    rating: 5,
  },
  {
    quote:
      'Simply the best. Found a top-rated wash near my office, picked a slot, and paid in seconds. Highly recommend.',
    name: 'Jacob Jones',
    role: 'Colombo 03',
    rating: 5,
  },
  {
    quote:
      'I cannot believe how easy it was to compare washes and prices. Brand new experience — super easy to book.',
    name: 'Jenny Wilson',
    role: 'Verified booking',
    rating: 5,
  },
];

const INCLUDED = [
  'No hidden fees — transparent pricing',
  'Compare top-rated washes near you',
  'Book and pay securely in seconds',
  'Live booking status updates',
  'Real reviews from real customers',
];

const OTHERS = [
  'Surprise charges at the counter',
  'Call around to check availability',
  'Cash only, no online payment',
  'No idea when your car is ready',
  'Unverified, inconsistent quality',
];

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: topRated, isLoading } = useTenantSearch({ sort: 'rating', limit: 6 });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  const galleryPhotos = (topRated?.data ?? [])
    .flatMap((t) => t.photos ?? [])
    .map((p) => p.url)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="bg-background">
      {/* ───── Hero (dark navy band) ───── */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 opacity-[0.12] [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Colombo's car wash marketplace
            </span>
            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
              Let&apos;s wash <span className="text-accent">n&apos; roll</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-lg text-white/70">
              Browse top-rated car washes near you, pick a time that works, and pay securely — all in one place.
            </p>

            <form
              onSubmit={onSearch}
              className="mx-auto mt-9 flex max-w-md items-center gap-2 rounded-full bg-white p-2 shadow-2xl"
            >
              <div className="flex flex-1 items-center gap-2 pl-3 text-foreground">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by area or business name"
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit" shape="pill" variant="accent">
                <Search className="h-4 w-4" /> Search
              </Button>
            </form>

            <div className="mt-8 flex justify-center">
              <SquareCta to="/register">Join Today</SquareCta>
            </div>
          </div>
        </div>
        <WaveDivider className="text-background" />
      </section>

      {/* ───── Gallery strip (light band) ───── */}
      <section className="container py-16 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl">
            Have a look at our car washes
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Explore a variety of snapshots showcasing the comprehensive range of services near you.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => {
            const url = galleryPhotos[i];
            return (
              <div
                key={i}
                className={cn(
                  'relative aspect-[3/4] overflow-hidden rounded-2xl bg-navy-900',
                  i % 2 === 1 && 'md:mt-8'
                )}
              >
                {url ? (
                  <img src={url} alt="Car wash" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Car className="h-12 w-12" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <SquareCta to="/search">Join Today</SquareCta>
        </div>
      </section>

      {/* ───── Top-rated (light band) ───── */}
      <section className="container pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black uppercase tracking-tight">Top-rated in Colombo</h2>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TenantCardSkeleton key={i} />
            ))}
          </div>
        ) : (topRated?.data.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No car washes listed yet. Check back soon!</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topRated?.data.slice(0, 6).map((t) => (
              <TenantCard key={t.id} tenant={t} />
            ))}
          </div>
        )}
      </section>

      {/* ───── Testimonials (dark navy band) ───── */}
      <section className="relative bg-navy-900 text-white">
        <WaveDivider className="text-background" flip />
        <div className="container py-16 md:py-20">
          <p className="text-center text-sm text-white/50">
            Thousands of drivers book their wash with WashCo
          </p>
          <h2 className="mt-2 text-center text-4xl font-black uppercase tracking-tight md:text-5xl">
            Our happy clients
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl bg-white p-6 text-foreground shadow-xl">
                <RatingStars rating={t.rating} />
                <Quote className="mt-4 h-6 w-6 text-accent" />
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <WaveDivider className="text-background" />
      </section>

      {/* ───── Why WashCo (light band) ───── */}
      <section className="container py-16 md:py-20">
        <p className="text-center text-sm text-muted-foreground">Most car owners work with us,</p>
        <h2 className="mt-2 text-center text-4xl font-black uppercase tracking-tight md:text-5xl">
          Why WashCo
        </h2>

        <div className="relative mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* WashCo */}
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-accent">With WashCo</h3>
            <ul className="mt-5 space-y-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Others */}
          <div className="rounded-2xl border bg-secondary/40 p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Other car washes
            </h3>
            <ul className="mt-5 space-y-4">
              {OTHERS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* VS badge */}
          <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900 px-4 py-2 text-sm font-black uppercase text-white shadow-lg md:inline-flex">
            VS
          </span>
        </div>
      </section>

      {/* ───── Find a location (dark navy band) ───── */}
      <section className="relative bg-navy-900 text-white">
        <WaveDivider className="text-background" flip />
        <div className="container py-16 text-center md:py-24">
          <h2 className="text-4xl font-black uppercase tracking-tight md:text-6xl">Find a location</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            WashCo is growing fast across Colombo — find a convenient, top-rated car wash nearest you.
          </p>

          {/* Stylized map motif */}
          <div className="relative mx-auto mt-12 h-56 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] [background-image:radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]">
            <span className="absolute left-[28%] top-[45%] flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground shadow-lg">
              <MapPin className="h-3.5 w-3.5" /> Colombo
            </span>
            <span className="absolute right-[30%] top-[35%] text-white">
              <MapPin className="h-5 w-5 drop-shadow" />
            </span>
            <span className="absolute bottom-[28%] right-[42%] text-white">
              <MapPin className="h-5 w-5 drop-shadow" />
            </span>
          </div>

          <div className="mt-12 flex justify-center">
            <SquareCta to="/search" tone="light">
              View locations
            </SquareCta>
          </div>
        </div>
        <WaveDivider className="text-background" />
      </section>

      {/* ───── How it works (light band) ───── */}
      <section className="container py-16">
        <h2 className="text-center text-3xl font-black uppercase tracking-tight">How it works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            { icon: Search, title: 'Search', desc: 'Find washes near you by location, price and rating.' },
            { icon: CalendarCheck, title: 'Book', desc: 'Pick a service and an available time slot, then pay securely.' },
            { icon: Car, title: 'Arrive', desc: 'Show up at your slot. Track your booking status live.' },
          ].map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-primary">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="mt-3 text-xs font-bold uppercase tracking-widest text-accent">
                Step {i + 1}
              </span>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── CTA banner (light band) ───── */}
      <section className="container pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-navy-900 px-8 py-12 text-center text-white md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Own a car wash?</h3>
            <p className="mt-2 text-white/70">
              List your business on WashCo and start taking bookings today.
            </p>
          </div>
          <SquareCta to="/register/tenant">List your business</SquareCta>
        </div>
      </section>
    </div>
  );
}
