import type { DbEvent, DbEventImage } from '../types/db';
import type { EventRecord } from '../types/event';
import { publicUrlFor } from './storage';
import { formatDateLabel, formatCheckinTime } from './formatDate';

export function mapEvents(events: DbEvent[], images: DbEventImage[]): EventRecord[] {
  const imagesByEvent = new Map<string, DbEventImage[]>();
  for (const img of images) {
    const list = imagesByEvent.get(img.event_id) ?? [];
    list.push(img);
    imagesByEvent.set(img.event_id, list);
  }

  return events.map((ev) => {
    const imgs = (imagesByEvent.get(ev.id) ?? []).slice().sort((a, b) => a.position - b.position);
    const thumbnail = imgs.find((i) => i.role === 'thumbnail');
    const gallery = imgs.filter((i) => i.role === 'gallery');

    return {
      id: ev.id,
      capacity: ev.capacity,
      remaining: ev.remaining,
      price: ev.price,
      shuttle: ev.shuttle,
      shuttleLocation: { ja: ev.shuttle_location_ja ?? '', en: ev.shuttle_location_en ?? '' },
      checkinTime: {
        ja: formatCheckinTime(ev.checkin_time_start, ev.checkin_time_end, 'ja'),
        en: formatCheckinTime(ev.checkin_time_start, ev.checkin_time_end, 'en'),
      },
      title: { ja: ev.title_ja, en: ev.title_en },
      place: { ja: ev.place_ja, en: ev.place_en },
      dateLabel: {
        ja: formatDateLabel(ev.start_date, ev.end_date, 'ja'),
        en: formatDateLabel(ev.start_date, ev.end_date, 'en'),
      },
      thumbnailUrl: thumbnail ? publicUrlFor(thumbnail.storage_path) : null,
      galleryUrls: gallery.map((g) => publicUrlFor(g.storage_path)),
    } satisfies EventRecord;
  });
}
