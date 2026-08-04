import { supabase, isSupabaseConfigured } from './supabase';

export interface ApplicationPayload {
  eventId: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  message: string;
}

/**
 * Submits a completed application to the `applications` table in Supabase
 * (insert-only for the anon role — see the RLS policy in the project setup).
 *
 * Card payment still needs a separate server-side step this static frontend
 * can't do alone: something with your Stripe *secret* key (a Supabase Edge
 * Function is the natural place) must create a PaymentIntent and return its
 * client_secret, which the browser then confirms via `stripe.confirmPayment()`.
 * See https://stripe.com/docs/payments/quickstart.
 */
export async function submitApplication(payload: ApplicationPayload): Promise<{ ok: true }> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn(
      '[submitApplication] Supabase not configured yet (src/lib/supabase.ts / .env) — simulating success.',
      payload,
    );
    return { ok: true };
  }

  const { error } = await supabase.from('applications').insert({
    event_id: payload.eventId,
    name: payload.name,
    email: payload.email,
    country: payload.country,
    phone: payload.phone,
    emergency_name: payload.emergencyName,
    emergency_relation: payload.emergencyRelation,
    emergency_phone: payload.emergencyPhone,
    message: payload.message || null,
  });

  if (error) {
    throw new Error(`Application submission failed: ${error.message}`);
  }

  return { ok: true };
}
