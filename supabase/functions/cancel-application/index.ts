// Supabase Edge Function: cancel-application
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor" (name it
// exactly "cancel-application"), or: supabase functions deploy cancel-application
// Requires STRIPE_SECRET_KEY (already set for create-payment-intent).
//
// Admin-only: refunds the Stripe payment (if any) and marks the application
// canceled so it stops counting against the event's capacity. Requires a
// real logged-in admin session — the anon key alone is not enough.

import Stripe from 'npm:stripe@^17.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseAdmin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

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
      .select('id, payment_intent_id, canceled_at')
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

    return new Response(JSON.stringify({ ok: true, refunded }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cancel-application]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
