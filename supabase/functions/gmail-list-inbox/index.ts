// Supabase Edge Function: gmail-list-inbox
//
// Deploy via the Supabase dashboard's Edge Functions "Via Editor", or:
//   supabase functions deploy gmail-list-inbox
// Requires secrets set beforehand:
//   supabase secrets set GOOGLE_CLIENT_ID=...
//   supabase secrets set GOOGLE_CLIENT_SECRET=...
//   supabase secrets set GOOGLE_REFRESH_TOKEN=...
// (see README notes in this PR for how to obtain these via Google OAuth Playground)
//
// Admin-only: lists the most recent messages in the signal@s-stylegolf.com
// inbox via the Gmail API, so the dashboard can show an inbox without a
// separate email-syncing database table. Read-only (gmail.readonly scope) —
// replying happens in Gmail itself, not this app.

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

    if (!GOOGLE_REFRESH_TOKEN) return jsonError(500, 'Gmail連携が設定されていません(GOOGLE_REFRESH_TOKEN)。');

    const accessToken = await getAccessToken();

    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=30',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!listRes.ok) throw new Error(`Gmail list failed: ${await listRes.text()}`);
    const listData = await listRes.json();
    const ids: { id: string; threadId: string }[] = listData.messages ?? [];

    const messages = await Promise.all(
      ids.map(async ({ id, threadId }) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) return null;
        const msg = await res.json();
        const headers = msg.payload?.headers ?? [];
        return {
          id,
          threadId,
          from: headerValue(headers, 'From'),
          subject: headerValue(headers, 'Subject') || '(件名なし)',
          date: headerValue(headers, 'Date'),
          snippet: msg.snippet ?? '',
          unread: (msg.labelIds ?? []).includes('UNREAD'),
        };
      }),
    );

    const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null);
    // Gmail threads can contain multiple messages; keep only the newest message per thread for the list view.
    const seenThreads = new Set<string>();
    const threadList = validMessages.filter((m) => {
      if (seenThreads.has(m.threadId)) return false;
      seenThreads.add(m.threadId);
      return true;
    });

    return new Response(JSON.stringify({ ok: true, messages: threadList }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[gmail-list-inbox]', err);
    return jsonError(500, err instanceof Error ? err.message : 'Unknown error');
  }
});
