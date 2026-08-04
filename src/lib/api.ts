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
  paymentIntentId: string | null;
}

/** Calls the create-payment-intent Edge Function, which looks the price up server-side. */
export async function createPaymentIntent(eventId: string): Promise<{ clientSecret: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { eventId },
  });
  if (error) throw error;
  if (!data?.clientSecret) throw new Error(data?.error ?? 'Failed to start payment.');
  return { clientSecret: data.clientSecret as string };
}

/**
 * Submits a completed application to the `applications` table in Supabase
 * (insert-only for the anon role — see the RLS policy in the project setup).
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
    payment_intent_id: payload.paymentIntentId,
  });

  if (error) {
    throw new Error(`Application submission failed: ${error.message}`);
  }

  return { ok: true };
}
