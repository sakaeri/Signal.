// Supabase Edge Function: create-payment-intent
//
// Deploy: supabase functions deploy create-payment-intent
// Requires a secret set beforehand: supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//
// Looks the event's price up server-side (never trusts an amount sent by the
// browser) and creates a Stripe PaymentIntent for it, returning just the
// client_secret the frontend needs to confirm payment.

import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventId } = await req.json();
    if (!eventId || typeof eventId !== 'string') {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: events, error: rpcError } = await supabase.rpc('get_events_with_remaining');
    if (rpcError) throw rpcError;

    const event = (events ?? []).find((e: { id: string }) => e.id === eventId);
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (event.remaining <= 0) {
      return new Response(JSON.stringify({ error: 'This event is full' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Card only for now: other JP payment methods (konbini, bank transfer, etc.)
    // redirect off-page, which the current frontend flow doesn't handle yet.
    // JPY has no minor unit, so the yen amount is the Stripe amount as-is.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: event.price,
      currency: 'jpy',
      payment_method_types: ['card'],
      metadata: { event_id: eventId },
    });

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
