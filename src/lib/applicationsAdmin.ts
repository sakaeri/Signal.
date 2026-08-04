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
