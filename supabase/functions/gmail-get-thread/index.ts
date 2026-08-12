// Supabase Edge Function: gmail-get-thread
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor", or:
//   supabase functions deploy gmail-get-thread
// Requires the same GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
// secrets as gmail-list-inbox.
//
// Admin-only: fetches every message in a Gmail thread (full body, decoded),
// and marks any unread messages in it as read.

import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN') ?? '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

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

function headerValue(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function decodeBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Depth-first search for a body part matching the given mime type. */
function findPart(part: GmailPart | undefined, mimeType: string): GmailPart | null {
  if (!part) return null;
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

function extractBody(payload: GmailPart): string {
  const plain = findPart(payload, 'text/plain');
  if (plain?.body?.data) return decodeBase64Url(plain.body.data);
  const html = findPart(payload, 'text/html');
  if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data));
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return '(本文を表示できませんでした)';
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

    const { threadId } = await req.json();
    if (!threadId || typeof threadId !== 'string') return jsonError(400, 'threadId is required');

    if (!GOOGLE_REFRESH_TOKEN) return jsonError(500, 'Gmail連携が設定されていません(GOOGLE_REFRESH_TOKEN)。');

    const accessToken = await getAccessToken();

    const threadRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!threadRes.ok) throw new Error(`Gmail thread fetch failed: ${await threadRes.text()}`);
    const thread = await threadRes.json();

    const rawMessages = thread.messages ?? [];
    const messages = rawMessages.map((msg: { id: string; labelIds?: string[]; payload: GmailPart & { headers: { name: string; value: string }[] } }) => {
      const headers = msg.payload.headers ?? [];
      return {
        id: msg.id,
        from: headerValue(headers, 'From'),
        to: headerValue(headers, 'To'),
        subject: headerValue(headers, 'Subject') || '(件名なし)',
        date: headerValue(headers, 'Date'),
        messageIdHeader: headerValue(headers, 'Message-ID'),
        body: extractBody(msg.payload),
        fromUs: (msg.labelIds ?? []).includes('SENT'),
        unread: (msg.labelIds ?? []).includes('UNREAD'),
      };
    });

    // Best-effort: mark unread messages in this thread as read now that they've been opened.
    const unreadIds = rawMessages
      .filter((m: { labelIds?: string[] }) => (m.labelIds ?? []).includes('UNREAD'))
      .map((m: { id: string }) => m.id);
    await Promise.all(
      unreadIds.map((id: string) =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
        }).catch((e) => console.error('[gmail-get-thread] failed to mark read', id, e)),
      ),
    );

    return new Response(JSON.stringify({ ok: true, messages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[gmail-get-thread]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
