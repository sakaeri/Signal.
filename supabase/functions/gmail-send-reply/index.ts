// Supabase Edge Function: gmail-send-reply
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor", or:
//   supabase functions deploy gmail-send-reply
// Requires the same GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
// secrets as gmail-list-inbox, plus optionally GOOGLE_SEND_AS (defaults to
// "Signal. <signal@s-stylegolf.com>").
//
// Admin-only: sends a reply within an existing Gmail thread via the Gmail
// API, so it shows up as a normal reply (correct threading, correct From
// address) both to the recipient and in the connected Gmail account itself.

import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN') ?? '';
const GOOGLE_SEND_AS = Deno.env.get('GOOGLE_SEND_AS') ?? 'Signal. <signal@s-stylegolf.com>';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMimeHeader(text: string): string {
  // deno-lint-ignore no-control-regex
  if (/^[\x00-\x7F]*$/.test(text)) return text;
  return `=?UTF-8?B?${utf8ToBase64(text)}?=`;
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
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser();
    if (userError || !userData.user) return jsonError(401, 'ログインが必要です。');

    const { threadId, to, subject, body, inReplyTo } = await req.json();
    if (!threadId || typeof threadId !== 'string') return jsonError(400, 'threadId is required');
    if (!to || typeof to !== 'string') return jsonError(400, 'to is required');
    if (!body || typeof body !== 'string') return jsonError(400, 'body is required');

    if (!GOOGLE_REFRESH_TOKEN) return jsonError(500, 'Gmail連携が設定されていません(GOOGLE_REFRESH_TOKEN)。');

    const accessToken = await getAccessToken();

    const replySubject = typeof subject === 'string' && subject.startsWith('Re:') ? subject : `Re: ${subject ?? ''}`;

    const headerLines = [
      `From: ${GOOGLE_SEND_AS}`,
      `To: ${to}`,
      `Subject: ${encodeMimeHeader(replySubject)}`,
      ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`] : []),
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
    ];
    const raw = `${headerLines.join('\r\n')}\r\n\r\n${utf8ToBase64(body)}`;

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(utf8ToBase64(raw)), threadId }),
    });
    if (!sendRes.ok) throw new Error(`Gmail send failed: ${await sendRes.text()}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[gmail-send-reply]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
