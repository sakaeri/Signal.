export interface EventRecord {
  id: string;
  capacity: number;
  remaining: number;
  price: number;
  shuttle: boolean;
  shuttleLocation: { ja: string; en: string };
  checkinTime: { ja: string; en: string };
  title: { ja: string; en: string };
  place: { ja: string; en: string };
  dateLabel: { ja: string; en: string };
  thumbnailUrl: string | null;
  galleryUrls: string[];
}
