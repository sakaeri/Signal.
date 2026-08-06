// Supabase Edge Function: stripe-webhook
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor" (name it
// exactly "stripe-webhook"), or: supabase functions deploy stripe-webhook
// IMPORTANT: this function must have "Enforce JWT Verification" turned OFF
// in its Settings tab — Stripe calls it directly and cannot send a Supabase
// JWT. Its own signature check (below) is what verifies the caller is Stripe.
//
// After deploying, create the webhook in the Stripe Dashboard:
//   Developers -> Webhooks -> Add endpoint
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events to send: charge.refunded
// Then copy the "Signing secret" it gives you and set it as a Supabase secret:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Catches refunds issued directly from the Stripe dashboard (not through our
// own cancel-application function) and marks the matching application
// canceled/refunded so it stops counting against capacity.

import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature || !WEBHOOK_SECRET) throw new Error('Missing signature or webhook secret');
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const now = new Date().toISOString();
        const { error } = await supabaseAdmin
          .from('applications')
          .update({ canceled_at: now, refunded_at: now })
          .eq('payment_intent_id', paymentIntentId)
          .is('canceled_at', null);
        if (error) console.error('[stripe-webhook] failed to update application', error);
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return new Response('Internal error', { status: 500 });
  }
});
