/** Shape returned by the get_events_with_remaining() RPC (used everywhere events are read). */
export interface DbEvent {
  id: string;
  start_date: string;
  end_date: string | null;
  capacity: number;
  remaining: number;
  price: number;
  shuttle: boolean;
  shuttle_location_ja: string | null;
  shuttle_location_en: string | null;
  meeting_point_ja: string | null;
  meeting_point_en: string | null;
  belongings_ja: string | null;
  belongings_en: string | null;
  map_url: string | null;
  day_contact_phone: string | null;
  checkin_time_start: string;
  checkin_time_end: string | null;
  title_ja: string;
  title_en: string;
  place_ja: string;
  place_en: string;
}

export interface DbEventImage {
  id: string;
  event_id: string;
  role: 'thumbnail' | 'gallery';
  storage_path: string;
  position: number;
  created_at: string;
}

export interface DbSiteImage {
  slot: string;
  storage_path: string;
  updated_at: string;
}

/** Generic key/value store for small site-wide settings (e.g. inquiry_email). */
export interface DbSiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface DbApplication {
  id: string;
  created_at: string;
  event_id: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  emergency_name: string;
  emergency_relation: string;
  emergency_phone: string;
  message: string | null;
  payment_intent_id: string | null;
  status_venue_info_sent: boolean;
  status_kit_collected: boolean;
  status_photos_developed: boolean;
  status_letter_mailed: boolean;
  canceled_at: string | null;
  refunded_at: string | null;
}

/** A single entry in an applicant's note history (application_notes table). */
export interface DbApplicationNote {
  id: string;
  application_id: string;
  author: string;
  content: string;
  created_at: string;
}
