import { loadStripe, Stripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js with the publishable key. Returns null if unconfigured. */
export function getStripe(): Promise<Stripe | null> {
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export const isStripeConfigured = Boolean(key);
