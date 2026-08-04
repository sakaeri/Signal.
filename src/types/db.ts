export interface DbEvent {
  id: string;
  sort_order: number;
  capacity: number;
  remaining: number;
  price: number;
  shuttle: boolean;
  checkin_time_ja: string;
  checkin_time_en: string;
  title_ja: string;
  title_en: string;
  place_ja: string;
  place_en: string;
  date_label_ja: string;
  date_label_en: string;
  created_at: string;
  updated_at: string;
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
}
