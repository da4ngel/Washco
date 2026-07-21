import Stripe from 'stripe';
import { env } from './env';

/**
 * Stripe client. When no secret key is configured (placeholder mode) this is
 * still constructed so imports don't crash, but any API call will fail loudly.
 * Guard live usage with `isConfigured.stripe`.
 */
export const stripe = new Stripe(env.stripeSecretKey || 'sk_test_placeholder', {
  // Use the SDK's pinned API version (omitting the literal keeps us in sync
  // with whichever stripe package version is installed).
  typescript: true,
  appInfo: { name: 'WashCo', version: '1.0.0' },
});
