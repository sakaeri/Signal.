// Supabase Edge Function: send-letter-mailed-email
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor", or:
//   supabase functions deploy send-letter-mailed-email
// Requires secrets set beforehand:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set EMAIL_FROM="Signal. <onboarding@resend.dev>"
//
// Mirrors send-venue-info-email: looks the application + its event up
// server-side, sends a "your letter has been mailed" notice via Resend, and
// only marks status_letter_mailed = true once the email actually sent.

import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Signal. <onboarding@resend.dev>';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function formatDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} 〜 ${endDate}`;
}

function buildEmailHtml(params: { name: string; titleJa: string; titleEn: string; dateRange: string }): string {
  return `
    <div style="font-family: sans-serif; line-height: 1.8; color: #2a2a24;">
      <p>${params.name} 様</p>
      <p>${params.dateRange}に開催した「${params.titleJa}」で現像したお写真とお手紙を発送いたしました。到着まで今しばらくお待ちください。</p>
      <p>この度はご参加いただき、誠にありがとうございました。</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e2d8;" />
      <p>Dear ${params.name},</p>
      <p>We've mailed your developed photos and letter from "${params.titleEn}" (${params.dateRange}). Please allow a little time for delivery.</p>
      <p>Thank you again for joining us.</p>
      <p style="color: #9a9686; font-size: 12px; margin-top: 32px;">— Signal.</p>
    </div>
  `;
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
    if (!RESEND_API_KEY) return jsonError(500, 'RESEND_API_KEY is not configured.');

    const { applicationId } = await req.json();
    if (!applicationId || typeof applicationId !== 'string') {
      return jsonError(400, 'applicationId is required');
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, name, email, event_id')
      .eq('id', applicationId)
      .single();
    if (appError || !application) return jsonError(404, 'Application not found');

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title_ja, title_en, start_date, end_date')
      .eq('id', application.event_id)
      .single();
    if (eventError || !event) return jsonError(404, 'Event not found');

    const html = buildEmailHtml({
      name: application.name,
      titleJa: event.title_ja,
      titleEn: event.title_en,
      dateRange: formatDateRange(event.start_date, event.end_date),
    });

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [application.email],
        subject: `【Signal.】${event.title_ja} お手紙を発送しました / Your letter is on its way`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      return jsonError(502, `Resend API error: ${detail}`);
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status_letter_mailed: true })
      .eq('id', applicationId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-letter-mailed-email]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
