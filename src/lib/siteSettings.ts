import { supabase } from './supabase';
import type { DbSiteSetting } from '../types/db';

/** Shown until the real site_settings row loads, so the UI never looks broken/blank. */
export const DEFAULT_INQUIRY_EMAIL = 'signal@s-stylegolf.com';

export async function fetchSiteSettings(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as DbSiteSetting[]) map[row.key] = row.value;
  return map;
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select('key');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('ログインしていないか、権限がないため保存できませんでした。/admin/login からログインしてから再度お試しください。');
  }
}
