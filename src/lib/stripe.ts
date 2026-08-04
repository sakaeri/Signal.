import { loadStripe, type Stripe } from '@stripe/stripe-js';

export const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51Te94JCDMRWUJewZu8bTMUmJ9dQNNGxyzOYJ2qQIWXgRaAoNH4m1ZUDGOfhIBlb9vrTiIa8KQodDQdntoTZjItZ500gRH13LXW';

export const isStripeConfigured =
  STRIPE_PUBLISHABLE_KEY.startsWith('pk_') && !STRIPE_PUBLISHABLE_KEY.includes('REPLACE');

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js. Returns null (never resolves the real SDK) until a real key is set above. */
export function getStripe(): Promise<Stripe | null> {
  if (!isStripeConfigured) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
