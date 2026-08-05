import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { DbApplication } from '../types/db';

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

export async function setApplicationNotes(id: string, notes: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('applications')
    .update({ admin_notes: notes || null })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

/** Sends the venue-info email via the send-venue-info-email Edge Function and marks it sent. */
export async function sendVenueInfoEmail(applicationId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('send-venue-info-email', {
    body: { applicationId },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (!data?.ok) throw new Error(data?.error ?? 'メール送信に失敗しました。');
}
