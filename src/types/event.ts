export interface EventRecord {
  id: string;
  sortOrder: number;
  capacity: number;
  remaining: number;
  price: number;
  shuttle: boolean;
  checkinTime: { ja: string; en: string };
  title: { ja: string; en: string };
  place: { ja: string; en: string };
  dateLabel: { ja: string; en: string };
  thumbnailUrl: string | null;
  galleryUrls: string[];
}
