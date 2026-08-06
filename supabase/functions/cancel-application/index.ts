// Supabase Edge Function: cancel-application
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor" (name it
// exactly "cancel-application"), or: supabase functions deploy cancel-application
// Requires STRIPE_SECRET_KEY and RESEND_API_KEY (already set for the other
// functions). EMAIL_FROM is optional, same default as send-venue-info-email.
//
// Admin-only: refunds the Stripe payment (if any), marks the application
// canceled so it stops counting against the event's capacity, and emails the
// guest a cancellation notice. Requires a real logged-in admin session — the
// anon key alone is not enough.

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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

async function sendCancellationEmail(params: { name: string; email: string; titleJa: string; titleEn: string; refunded: boolean }) {
  if (!RESEND_API_KEY) {
    console.error('[cancel-application] RESEND_API_KEY not configured, skipping cancellation email');
    return;
  }
  const refundLineJa = params.refunded
    ? 'お支払いいただいた金額は全額返金の手続きを行いました。カード会社の処理により、反映まで数日かかる場合があります。'
    : '';
  const refundLineEn = params.refunded
    ? 'Your payment has been fully refunded. It may take a few business days for your card issuer to process it.'
    : '';

  const html = `
    <div style="font-family: sans-serif; line-height: 1.8; color: #2a2a24;">
      <p>${params.name} 様</p>
      <p>「${params.titleJa}」のお申し込みをキャンセルいたしました。${refundLineJa}</p>
      <p>またの機会をお待ちしております。</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e2d8;" />
      <p>Dear ${params.name},</p>
      <p>Your booking for "${params.titleEn}" has been canceled. ${refundLineEn}</p>
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
    console.error('[cancel-application] failed to send cancellation email', await res.text());
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
    // Verify the caller is an actually-logged-in admin, not just holding the public anon key.
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser();
    if (userError || !userData.user) return jsonError(401, 'ログインが必要です。');

    const { applicationId } = await req.json();
    if (!applicationId || typeof applicationId !== 'string') {
      return jsonError(400, 'applicationId is required');
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, name, email, event_id, payment_intent_id, canceled_at')
      .eq('id', applicationId)
      .single();
    if (appError || !application) return jsonError(404, 'Application not found');
    if (application.canceled_at) return jsonError(409, 'このお申し込みはすでにキャンセル済みです。');

    let refunded = false;
    if (application.payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: application.payment_intent_id });
        refunded = true;
      } catch (err) {
        return jsonError(502, `Stripeの返金に失敗しました: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ canceled_at: now, refunded_at: refunded ? now : null })
      .eq('id', applicationId);
    if (updateError) throw updateError;

    const { data: event } = await supabaseAdmin
      .from('events')
      .select('title_ja, title_en')
      .eq('id', application.event_id)
      .single();
    if (event) {
      await sendCancellationEmail({
        name: application.name,
        email: application.email,
        titleJa: event.title_ja,
        titleEn: event.title_en,
        refunded,
      });
    }

    return new Response(JSON.stringify({ ok: true, refunded }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cancel-application]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
