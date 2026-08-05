// Supabase Edge Function: send-venue-info-email
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor", or:
//   supabase functions deploy send-venue-info-email
// Requires secrets set beforehand:
//   supabase secrets set RESEND_API_KEY=re_...
//   supabase secrets set EMAIL_FROM="Signal. <onboarding@resend.dev>"   (optional; see note below)
//
// Looks the application + its event up server-side (never trusts email
// content from the browser), sends the venue-info email via Resend, and
// only marks status_venue_info_sent = true once the email actually sent.

import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
// resend.dev is Resend's shared testing domain — it works out of the box but is not
// a great "from" address for real guests. Verify your own domain in Resend, then set
// EMAIL_FROM to something like "Signal. <info@your-domain.jp>".
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Signal. <onboarding@resend.dev>';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function formatDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) return startDate;
  return `${startDate} 〜 ${endDate}`;
}

function formatTimeRange(start: string, end: string | null): string {
  const s = start.slice(0, 5);
  if (!end) return s;
  return `${s}〜${end.slice(0, 5)}`;
}

function buildEmailHtml(params: {
  name: string;
  titleJa: string;
  titleEn: string;
  placeJa: string;
  placeEn: string;
  dateRange: string;
  checkinTime: string;
  shuttle: boolean;
  shuttleLocationJa: string | null;
  shuttleLocationEn: string | null;
  meetingPointJa: string | null;
  meetingPointEn: string | null;
  belongingsJa: string | null;
  belongingsEn: string | null;
}): string {
  const meet = params.shuttle
    ? `送迎あり: ${params.shuttleLocationJa ?? ''} にお集まりください / Shuttle pickup at ${params.shuttleLocationEn ?? ''}`
    : `現地集合・解散です / Meet on-site`;

  const row = (label: string, value: string | null) =>
    value ? `<tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">${label}</td><td>${value}</td></tr>` : '';

  return `
    <div style="font-family: sans-serif; line-height: 1.8; color: #2a2a24;">
      <p>${params.name} 様</p>
      <p>この度は「${params.titleJa}」にお申し込みいただき、ありがとうございます。<br/>当日の集合場所・時間のご案内です。</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">開催地</td><td>${params.placeJa}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">日程</td><td>${params.dateRange}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">集合時間</td><td>${params.checkinTime}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">集合方法</td><td>${meet}</td></tr>
        ${row('集合場所の詳細', params.meetingPointJa)}
        ${row('持ち物', params.belongingsJa)}
      </table>
      <p>当日お会いできるのを楽しみにしております。</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e2d8;" />
      <p>Dear ${params.name},</p>
      <p>Thank you for booking "${params.titleEn}". Here are the check-in details for the day.</p>
      <table style="margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">Location</td><td>${params.placeEn}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">Dates</td><td>${params.dateRange}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #6a665c;">Check-in time</td><td>${params.checkinTime}</td></tr>
        ${row('Meeting point', params.meetingPointEn)}
        ${row('What to bring', params.belongingsEn)}
      </table>
      <p>We look forward to seeing you.</p>
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
      .select(
        'title_ja, title_en, place_ja, place_en, start_date, end_date, checkin_time_start, checkin_time_end, shuttle, shuttle_location_ja, shuttle_location_en, meeting_point_ja, meeting_point_en, belongings_ja, belongings_en',
      )
      .eq('id', application.event_id)
      .single();
    if (eventError || !event) return jsonError(404, 'Event not found');

    const html = buildEmailHtml({
      name: application.name,
      titleJa: event.title_ja,
      titleEn: event.title_en,
      placeJa: event.place_ja,
      placeEn: event.place_en,
      dateRange: formatDateRange(event.start_date, event.end_date),
      checkinTime: formatTimeRange(event.checkin_time_start, event.checkin_time_end),
      shuttle: event.shuttle,
      shuttleLocationJa: event.shuttle_location_ja,
      shuttleLocationEn: event.shuttle_location_en,
      meetingPointJa: event.meeting_point_ja,
      meetingPointEn: event.meeting_point_en,
      belongingsJa: event.belongings_ja,
      belongingsEn: event.belongings_en,
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
        subject: `【Signal.】${event.title_ja} 会場のご案内 / Venue details`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      return jsonError(502, `Resend API error: ${detail}`);
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status_venue_info_sent: true })
      .eq('id', applicationId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-venue-info-email]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
