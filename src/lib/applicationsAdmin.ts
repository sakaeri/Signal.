import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { DbApplication, DbApplicationNote } from '../types/db';

export async function fetchApplications(): Promise<DbApplication[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbApplication[];
}

export type ApplicationStatusField =
  | 'status_venue_info_sent'
  | 'status_kit_collected'
  | 'status_photos_developed'
  | 'status_letter_mailed';

const RLS_DENIED_MESSAGE =
  'ログインしていないか、権限がないため保存できませんでした。/admin/login からログインしてから再度お試しください。';

export async function setApplicationStatus(id: string, field: ApplicationStatusField, value: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('applications').update({ [field]: value }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

export async function fetchAllApplicationNotes(): Promise<DbApplicationNote[]> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('application_notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbApplicationNote[];
}

export async function addApplicationNote(applicationId: string, author: string, content: string): Promise<DbApplicationNote> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('application_notes')
    .insert({ application_id: applicationId, author, content })
    .select('*')
    .single();
  if (error) throw error;
  if (!data) throw new Error(RLS_DENIED_MESSAGE);
  return data as DbApplicationNote;
}

export async function deleteApplicationNote(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('application_notes').delete().eq('id', id);
  if (error) throw error;
}

/** Refunds the Stripe payment (if any) and marks the application canceled via the cancel-application Edge Function. */
export async function cancelApplication(applicationId: string): Promise<{ refunded: boolean }> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('cancel-application', {
    body: { applicationId },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (!data?.ok) throw new Error(data?.error ?? 'キャンセル処理に失敗しました。');
  return { refunded: Boolean(data.refunded) };
}
