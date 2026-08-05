import { FunctionsHttpError } from '@supabase/supabase-js';
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

/**
 * Calls the create-payment-intent Edge Function, which looks the price up server-side.
 * Deployed under the slug "rapid-handler" (Supabase's editor auto-named it before it
 * was renamed, and renaming a function's display name doesn't change its slug/URL).
 */
export async function createPaymentIntent(eventId: string): Promise<{ clientSecret: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabase.functions.invoke('rapid-handler', {
    body: { eventId },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (!data?.clientSecret) throw new Error(data?.error ?? 'Failed to start payment.');
  return { clientSecret: data.clientSecret as string };
}

/**
 * Submits a completed application to the `applications` table in Supabase
 * (insert-only for the anon role — see the RLS policy in the project setup).
 * Returns the new row's id (null in the unconfigured/simulated-success path).
 */
export async function submitApplication(payload: ApplicationPayload): Promise<{ id: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn(
      '[submitApplication] Supabase not configured yet (src/lib/supabase.ts / .env) — simulating success.',
      payload,
    );
    return { id: null };
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
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
    })
    .select('id');

  if (error) {
    throw new Error(`Application submission failed: ${error.message}`);
  }

  return { id: data?.[0]?.id ?? null };
}

/**
 * Sends the venue-info email via the send-venue-info-email Edge Function and marks it sent.
 * Used both right after a successful application (automatic) and from the admin dashboard (manual resend).
 */
export async function sendVenueInfoEmail(applicationId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { data, error } = await supabase.functions.invoke('send-venue-info-email', {
    body: { applicationId },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (!data?.ok) throw new Error(data?.error ?? 'メール送信に失敗しました。');
}
