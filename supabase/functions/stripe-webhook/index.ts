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
// canceled/refunded so it stops counting against capacity, then emails the
// guest a cancellation notice. The .is('canceled_at', null) filter below
// means this is a no-op (and sends no email) if cancel-application already
// handled it, so a guest never gets the notice twice.

import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Signal. <onboarding@resend.dev>';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

async function sendCancellationEmail(params: { name: string; email: string; titleJa: string; titleEn: string }) {
  if (!RESEND_API_KEY) {
    console.error('[stripe-webhook] RESEND_API_KEY not configured, skipping cancellation email');
    return;
  }
  const html = `
    <div style="font-family: sans-serif; line-height: 1.8; color: #2a2a24;">
      <p>${params.name} 様</p>
      <p>「${params.titleJa}」のお申し込みをキャンセルいたしました。お支払いいただいた金額は全額返金の手続きを行いました。カード会社の処理により、反映まで数日かかる場合があります。</p>
      <p>またの機会をお待ちしております。</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e2d8;" />
      <p>Dear ${params.name},</p>
      <p>Your booking for "${params.titleEn}" has been canceled. Your payment has been fully refunded. It may take a few business days for your card issuer to process it.</p>
      <p>We hope to see you another time.</p>
      <p style="color: #9a9686; font-size: 12px; margin-top: 32px;">— Signal.</p>
    </div>
  `;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [params.email],
      subject: `【Signal.】${params.titleJa} キャンセルのご連絡 / Cancellation confirmed`,
      html,
    }),
  });
  if (!res.ok) {
    console.error('[stripe-webhook] failed to send cancellation email', await res.text());
  }
}

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
        const { data: updated, error } = await supabaseAdmin
          .from('applications')
          .update({ canceled_at: now, refunded_at: now })
          .eq('payment_intent_id', paymentIntentId)
          .is('canceled_at', null)
          .select('name, email, event_id')
          .maybeSingle();
        if (error) {
          console.error('[stripe-webhook] failed to update application', error);
        } else if (updated) {
          const { data: eventRow } = await supabaseAdmin
            .from('events')
            .select('title_ja, title_en')
            .eq('id', updated.event_id)
            .single();
          if (eventRow) {
            await sendCancellationEmail({
              name: updated.name,
              email: updated.email,
              titleJa: eventRow.title_ja,
              titleEn: eventRow.title_en,
            });
          }
        }
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    return new Response('Internal error', { status: 500 });
  }
});
