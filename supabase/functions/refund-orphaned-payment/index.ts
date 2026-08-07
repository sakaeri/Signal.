// Supabase Edge Function: refund-orphaned-payment
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor" (name it
// exactly "refund-orphaned-payment"), or: supabase functions deploy refund-orphaned-payment
// Requires STRIPE_SECRET_KEY and RESEND_API_KEY (already set for the other
// functions).
//
// Public safety net, called by the browser right after a successful Stripe
// payment whose applications-table insert failed. Without this, a guest
// could be charged with no booking ever recorded and no way to know it.
// Refunds the payment and emails the site's inquiry address so the
// underlying save failure (e.g. a broken RLS policy) actually gets noticed.

import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Signal. <onboarding@resend.dev>';
const DEFAULT_INQUIRY_EMAIL = 'signal@s-stylegolf.com';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

async function notifyOperator(paymentIntentId: string, saveError: string, eventId: string | null) {
  if (!RESEND_API_KEY) {
    console.error('[refund-orphaned-payment] RESEND_API_KEY not configured, skipping operator notification');
    return;
  }
  const { data: setting } = await supabase.from('site_settings').select('value').eq('key', 'inquiry_email').maybeSingle();
  const to = setting?.value || DEFAULT_INQUIRY_EMAIL;

  const html = `
    <div style="font-family: sans-serif; line-height: 1.8; color: #2a2a24;">
      <p>決済は成功しましたが、申し込み情報の保存に失敗したため、お客様への決済分を自動的に全額返金しました。</p>
      <p>Payment Intent: ${paymentIntentId}<br/>Event ID: ${eventId ?? '(不明)'}</p>
      <p>保存エラー: ${saveError}</p>
      <p>この問題が繰り返す場合、applicationsテーブルのRLS(INSERT)ポリシーなど保存経路を確認してください。</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: '【Signal.】決済成功・申し込み保存失敗により自動返金しました',
      html,
    }),
  });
  if (!res.ok) {
    console.error('[refund-orphaned-payment] failed to send operator notification', await res.text());
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const jsonError = (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { paymentIntentId, saveError } = await req.json();
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return jsonError(400, 'paymentIntentId is required');
    }

    // Never refund a payment that's actually tied to a saved application —
    // this endpoint is only for the orphaned-payment case.
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();
    if (existingApplication) {
      return jsonError(409, 'This payment is already linked to a saved application.');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
      return jsonError(409, `Payment is not in a refundable state (${paymentIntent.status}).`);
    }

    const existingRefunds = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 });
    const eventId = typeof paymentIntent.metadata?.event_id === 'string' ? paymentIntent.metadata.event_id : null;

    if (existingRefunds.data.length === 0) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
      await notifyOperator(paymentIntentId, typeof saveError === 'string' ? saveError : 'unknown', eventId);
    }

    return new Response(JSON.stringify({ ok: true, refunded: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[refund-orphaned-payment]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
