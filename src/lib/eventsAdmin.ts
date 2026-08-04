import { supabase } from './supabase';
import { uploadMedia, deleteMedia } from './storage';
import type { DbEvent, DbEventImage } from '../types/db';

export interface EventInput {
  id: string;
  sortOrder: number;
  capacity: number;
  remaining: number;
  price: number;
  shuttle: boolean;
  checkinTimeJa: string;
  checkinTimeEn: string;
  titleJa: string;
  titleEn: string;
  placeJa: string;
  placeEn: string;
  dateLabelJa: string;
  dateLabelEn: string;
}

function toRow(input: EventInput) {
  return {
    id: input.id,
    sort_order: input.sortOrder,
    capacity: input.capacity,
    remaining: input.remaining,
    price: input.price,
    shuttle: input.shuttle,
    checkin_time_ja: input.checkinTimeJa,
    checkin_time_en: input.checkinTimeEn,
    title_ja: input.titleJa,
    title_en: input.titleEn,
    place_ja: input.placeJa,
    place_en: input.placeEn,
    date_label_ja: input.dateLabelJa,
    date_label_en: input.dateLabelEn,
    updated_at: new Date().toISOString(),
  };
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function fetchAdminEvents(): Promise<{ events: DbEvent[]; images: DbEventImage[] }> {
  const db = requireSupabase();
  const [eventsRes, imagesRes] = await Promise.all([
    db.from('events').select('*').order('sort_order', { ascending: true }),
    db.from('event_images').select('*').order('position', { ascending: true }),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  if (imagesRes.error) throw imagesRes.error;
  return { events: (eventsRes.data ?? []) as DbEvent[], images: (imagesRes.data ?? []) as DbEventImage[] };
}

export async function createEvent(input: EventInput): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from('events').insert(toRow(input));
  if (error) throw error;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from('events').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from('events').delete().eq('id', id);
  if (error) throw error;
}

/** Uploads a file and replaces the event's single thumbnail (deletes the previous one, if any). */
export async function setEventThumbnail(eventId: string, file: File, previous?: DbEventImage): Promise<void> {
  const db = requireSupabase();
  const path = await uploadMedia(`events/${eventId}/thumbnail`, file);
  if (previous) {
    await db.from('event_images').delete().eq('id', previous.id);
    await deleteMedia(previous.storage_path).catch(() => {});
  }
  const { error } = await db
    .from('event_images')
    .insert({ event_id: eventId, role: 'thumbnail', storage_path: path, position: 0 });
  if (error) throw error;
}

export async function addGalleryImage(eventId: string, file: File, position: number): Promise<void> {
  const db = requireSupabase();
  const path = await uploadMedia(`events/${eventId}/gallery`, file);
  const { error } = await db
    .from('event_images')
    .insert({ event_id: eventId, role: 'gallery', storage_path: path, position });
  if (error) throw error;
}

export async function removeEventImage(image: DbEventImage): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from('event_images').delete().eq('id', image.id);
  if (error) throw error;
  await deleteMedia(image.storage_path).catch(() => {});
}
