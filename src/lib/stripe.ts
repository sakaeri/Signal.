import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * TODO: replace with your real Stripe publishable key from
 * https://dashboard.stripe.com/apikeys (pk_test_... while testing,
 * pk_live_... in production). Never put a secret key (sk_...) here —
 * this file ships to the browser.
 */
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY';

export const isStripeConfigured =
  STRIPE_PUBLISHABLE_KEY.startsWith('pk_') && !STRIPE_PUBLISHABLE_KEY.includes('REPLACE');

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js. Returns null (never resolves the real SDK) until a real key is set above. */
export function getStripe(): Promise<Stripe | null> {
  if (!isStripeConfigured) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}
