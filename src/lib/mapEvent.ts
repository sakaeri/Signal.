import type { DbEvent, DbEventImage } from '../types/db';
import type { EventRecord } from '../types/event';
import { publicUrlFor } from './storage';

export function mapEvents(events: DbEvent[], images: DbEventImage[]): EventRecord[] {
  const imagesByEvent = new Map<string, DbEventImage[]>();
  for (const img of images) {
    const list = imagesByEvent.get(img.event_id) ?? [];
    list.push(img);
    imagesByEvent.set(img.event_id, list);
  }

  return events
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ev) => {
      const imgs = (imagesByEvent.get(ev.id) ?? []).slice().sort((a, b) => a.position - b.position);
      const thumbnail = imgs.find((i) => i.role === 'thumbnail');
      const gallery = imgs.filter((i) => i.role === 'gallery');

      return {
        id: ev.id,
        sortOrder: ev.sort_order,
        capacity: ev.capacity,
        remaining: ev.remaining,
        price: ev.price,
        shuttle: ev.shuttle,
        checkinTime: { ja: ev.checkin_time_ja, en: ev.checkin_time_en },
        title: { ja: ev.title_ja, en: ev.title_en },
        place: { ja: ev.place_ja, en: ev.place_en },
        dateLabel: { ja: ev.date_label_ja, en: ev.date_label_en },
        thumbnailUrl: thumbnail ? publicUrlFor(thumbnail.storage_path) : null,
        galleryUrls: gallery.map((g) => publicUrlFor(g.storage_path)),
      } satisfies EventRecord;
    });
}
