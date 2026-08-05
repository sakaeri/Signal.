import { supabase } from './supabase';
import { uploadMedia, deleteMedia } from './storage';
import type { DbEvent, DbEventImage } from '../types/db';

export interface EventInput {
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  shuttle: boolean;
  shuttleLocationJa: string;
  shuttleLocationEn: string;
  meetingPointJa: string;
  meetingPointEn: string;
  belongingsJa: string;
  belongingsEn: string;
  checkinTimeStart: string;
  checkinTimeEnd: string;
  titleJa: string;
  titleEn: string;
  placeJa: string;
  placeEn: string;
}

const RLS_DENIED_MESSAGE =
  'ログインしていないか、権限がないため保存/削除できませんでした。/admin/login からログインしてから再度お試しください。';

function toRow(input: EventInput) {
  return {
    start_date: input.startDate,
    end_date: input.endDate || null,
    capacity: input.capacity,
    price: input.price,
    shuttle: input.shuttle,
    shuttle_location_ja: input.shuttle ? input.shuttleLocationJa || null : null,
    shuttle_location_en: input.shuttle ? input.shuttleLocationEn || null : null,
    meeting_point_ja: input.meetingPointJa || null,
    meeting_point_en: input.meetingPointEn || null,
    belongings_ja: input.belongingsJa || null,
    belongings_en: input.belongingsEn || null,
    checkin_time_start: input.checkinTimeStart,
    checkin_time_end: input.checkinTimeEnd || null,
    title_ja: input.titleJa,
    title_en: input.titleEn,
    place_ja: input.placeJa,
    place_en: input.placeEn,
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
    db.rpc('get_events_with_remaining'),
    db.from('event_images').select('*').order('position', { ascending: true }),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  if (imagesRes.error) throw imagesRes.error;
  return { events: (eventsRes.data ?? []) as DbEvent[], images: (imagesRes.data ?? []) as DbEventImage[] };
}

/** Returns the new event's id, so callers (e.g. duplication) can attach images to it. */
export async function createEvent(input: EventInput): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db.from('events').insert(toRow(input)).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
  return data[0].id as string;
}

/** Points the new event at the same underlying image files as the source event (no file copy needed). */
export async function duplicateEventImages(sourceEventId: string, newEventId: string): Promise<void> {
  const db = requireSupabase();
  const { data: images, error: fetchError } = await db
    .from('event_images')
    .select('role, storage_path, position')
    .eq('event_id', sourceEventId);
  if (fetchError) throw fetchError;
  if (!images || images.length === 0) return;

  const rows = images.map((img) => ({ event_id: newEventId, ...img }));
  const { error: insertError } = await db.from('event_images').insert(rows);
  if (insertError) throw insertError;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db.from('events').update(toRow(input)).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db.from('events').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

/** Uploads a file and replaces the event's single thumbnail (deletes the previous one, if any). */
export async function setEventThumbnail(eventId: string, file: File, previous?: DbEventImage): Promise<void> {
  const db = requireSupabase();
  const path = await uploadMedia(`events/${eventId}/thumbnail`, file);
  if (previous) {
    await db.from('event_images').delete().eq('id', previous.id);
    await deleteMedia(previous.storage_path).catch(() => {});
  }
  const { data, error } = await db
    .from('event_images')
    .insert({ event_id: eventId, role: 'thumbnail', storage_path: path, position: 0 })
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

export async function addGalleryImage(eventId: string, file: File, position: number): Promise<void> {
  const db = requireSupabase();
  const path = await uploadMedia(`events/${eventId}/gallery`, file);
  const { data, error } = await db
    .from('event_images')
    .insert({ event_id: eventId, role: 'gallery', storage_path: path, position })
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
}

export async function removeEventImage(image: DbEventImage): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db.from('event_images').delete().eq('id', image.id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(RLS_DENIED_MESSAGE);
  await deleteMedia(image.storage_path).catch(() => {});
}
