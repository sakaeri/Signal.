import { supabase } from './supabase';

const BUCKET = 'media';

export function publicUrlFor(storagePath: string): string {
  if (!supabase) return '';
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot) : '';
}

/** Uploads a file under a folder prefix and returns its storage path (not the public URL). */
export async function uploadMedia(folder: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extOf(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteMedia(storagePath: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw error;
}
