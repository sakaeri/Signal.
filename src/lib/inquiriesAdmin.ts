import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface InboxMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
}

export interface ThreadMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  messageIdHeader: string;
  body: string;
  fromUs: boolean;
  unread: boolean;
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const errBody = await error.context.json().catch(() => null);
      throw new Error(errBody?.error ?? error.message);
    }
    throw error;
  }
  if (!data?.ok) throw new Error(data?.error ?? '処理に失敗しました。');
  return data as T;
}

export async function fetchInbox(): Promise<InboxMessage[]> {
  const data = await invoke<{ messages: InboxMessage[] }>('gmail-list-inbox', {});
  return data.messages;
}

export async function fetchThread(threadId: string): Promise<ThreadMessage[]> {
  const data = await invoke<{ messages: ThreadMessage[] }>('gmail-get-thread', { threadId });
  return data.messages;
}
