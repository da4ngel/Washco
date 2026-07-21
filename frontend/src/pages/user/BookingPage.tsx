import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { format, parseISO } from 'date-fns';
import { Check, ChevronLeft, Loader2, CalendarDays, Clock, Car } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/hooks/useTenants';
import { useAvailability } from '@/hooks/useTimeSlots';
import { useCreateBooking } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { ServiceSelector } from '@/components/booking/ServiceSelector';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { getStripe } from '@/lib/stripe';
import { cn, formatLKR, formatTime } from '@/lib/utils';
import { createPaymentIntent, confirmPayment } from '@/services/payment.service';
import { getApiErrorMessage } from '@/services/api';
import { Booking } from '@/types';

const stripePromise = getStripe();
const STEPS = ['Service', 'Date & time', 'Confirm', 'Pay'] as const;

export function BookingPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  const { data: tenant, isLoading } = useTenant(tenantId);
  const store = useBookingStore();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [preparing, setPreparing] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10);
  const availability = useAvailability(tenantId, today, to);

  // Ensure the store's tenant matches the route.
  useEffect(() => {
    if (tenant && store.selectedTenant?.id !== tenant.id) {
      store.setTenant(tenant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  const slotsForDate = useMemo(
    () => (store.selectedDate ? availability.byDate.get(store.selectedDate) ?? [] : []),
    [store.selectedDate, availability.byDate]
  );

  if (isLoading) return <LoadingSpinner fullPage label="Loading…" />;
  if (!tenant) {
    return (
      <div className="container py-10">
        <EmptyState title="Car wash not found" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-semibold">Log in to book</h2>
            <p className="text-sm text-muted-foreground">You need an account to complete a booking.</p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link to={`/login?redirect=/book/${tenantId}`}>Log in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canNext =
    (step === 0 && store.selectedService) ||
    (step === 1 && store.selectedSlot) ||
    step === 2;

  /** Confirm step → create the booking + payment intent, then go to Pay. */
  const proceedToPayment = async () => {
    if (!store.selectedService || !store.selectedSlot) return;
    setPreparing(true);
    try {
      const created = await createBooking.mutateAsync({
        tenant_id: tenant.id,
        service_id: store.selectedService.id,
        slot_id: store.selectedSlot.id,
        user_notes: store.userNotes || undefined,
      });
      setBooking(created);

      const intent = await createPaymentIntent(created.id);
      setClientSecret(intent.client_secret);
      setAmount(intent.amount / 100);
      setStep(3);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start payment.'));
    } finally {
      setPreparing(false);
    }
  };

  const onPaid = async (paymentIntentId: string) => {
    if (!booking) return;
    try {
      await confirmPayment(booking.id, paymentIntentId);
    } catch {
      // The webhook is the source of truth; proceed to success regardless.
    }
    toast.success('Payment successful!');
    store.reset();
    navigate(`/booking/${booking.id}/success`);
  };

  const service = store.selectedService;
  const slot = store.selectedSlot;

  return (
    <div className="container max-w-3xl py-6">
      <button
        onClick={() => (step === 0 ? navigate(-1) : setStep((s) => Math.max(0, s - 1)))}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        disabled={step === 3}
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                  i < step && 'border-primary bg-primary text-primary-foreground',
                  i === step && 'border-primary text-primary',
                  i > step && 'border-muted text-muted-foreground'
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('hidden text-sm sm:inline', i === step ? 'font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className={cn('mx-2 h-px flex-1', i < step ? 'bg-primary' : 'bg-border')} />}
          </li>
        ))}
      </ol>

      <h1 className="mb-1 text-xl font-bold">{tenant.business_name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{tenant.address}</p>

      {/* Step content */}
      {step === 0 && (
        <ServiceSelector
          services={tenant.services}
          selectedId={service?.id}
          onSelect={(s) => store.setService(s)}
        />
      )}

      {step === 1 && (
        <>
          {availability.isLoading ? (
            <LoadingSpinner label="Loading availability…" />
          ) : (
            <TimeSlotPicker
              dates={availability.availableDates}
              slotsForDate={slotsForDate}
              selectedDate={store.selectedDate}
              selectedSlotId={slot?.id}
              onSelectDate={(d) => store.setDate(d)}
              onSelectSlot={(s) => store.setSlot(s)}
            />
          )}
        </>
      )}

      {step === 2 && service && slot && (
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <Row icon={Car} label="Service" value={`${service.name} · ${service.duration_minutes} min`} />
              <Row icon={CalendarDays} label="Date" value={format(parseISO(slot.date), 'EEEE, d MMMM yyyy')} />
              <Row icon={Clock} label="Time" value={formatTime(slot.start_time)} />
            </CardContent>
          </Card>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes for the car wash (optional)</label>
            <Textarea
              rows={3}
              placeholder="Any special requests?"
              value={store.userNotes}
              onChange={(e) => store.setNotes(e.target.value)}
            />
          </div>

          <PriceBreakdown price={Number(service.price)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          {service && slot && <PriceBreakdown price={Number(service.price)} />}
          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: resolvedTheme === 'dark' ? 'night' : 'stripe' } }}
            >
              <PaymentForm amount={amount} onSuccess={onPaid} />
            </Elements>
          ) : (
            <EmptyState
              title="Payments unavailable"
              description="Card payments aren't configured on this server yet."
            />
          )}
        </div>
      )}

      {/* Footer nav */}
      {step < 3 && (
        <div className="mt-8 flex justify-end">
          {step < 2 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button disabled={preparing} onClick={proceedToPayment}>
              {preparing && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue to payment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="w-16 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PriceBreakdown({ price }: { price: number }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Service price</span>
        <span>{formatLKR(price)}</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span className="text-muted-foreground">Processing fee</span>
        <span className="text-accent">Included</span>
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatLKR(price)}</span>
      </div>
    </div>
  );
}
