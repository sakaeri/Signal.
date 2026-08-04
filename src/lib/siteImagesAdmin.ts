import { supabase } from './supabase';
import { uploadMedia, deleteMedia } from './storage';
import type { DbSiteImage } from '../types/db';

const RLS_DENIED_MESSAGE =
  'ログインしていないか、権限がないため保存/削除できませんでした。/admin/login からログインしてから再度お試しください。';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function fetchSiteImageRows(): Promise<DbSiteImage[]> {
  const db = requireSupabase();
  const { data, error } = await db.from('site_images').select('*');
  if (error) throw error;
  return (data ?? []) as DbSiteImage[];
}

/** Uploads a file and upserts it as the image for the given slot, deleting the old file if replaced. */
export async function setSiteImage(slot: string, file: File, previous?: DbSiteImage): Promise<void> {
  const db = requireSupabase();
  const path = await uploadMedia(`site/${slot}`, file);
  const { data, error } = await db
    .from('site_images')
    .upsert({ slot, storage_path: path, updated_at: new Date().toISOString() })
    .select('slot');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
  if (previous) await deleteMedia(previous.storage_path).catch(() => {});
}

export async function clearSiteImage(row: DbSiteImage): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db.from('site_images').delete().eq('slot', row.slot).select('slot');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
  await deleteMedia(row.storage_path).catch(() => {});
}
