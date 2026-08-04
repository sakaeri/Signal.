import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useBooking } from '../context/BookingContext';
import { useSiteData } from '../context/SiteDataContext';
import EventCard from './EventCard';
import GalleryLightbox from './GalleryLightbox';
import './Events.css';

export default function Events() {
  const { t, lang } = useLanguage();
  const { selectedEventId, selectEvent } = useBooking();
  const { events, eventsLoading, eventsError } = useSiteData();
  const [galleryEventId, setGalleryEventId] = useState<string | null>(null);

  const galleryEvent = events.find((ev) => ev.id === galleryEventId) ?? null;

  return (
    <section id="events" className="events-section">
      <div className="section-header">
        <div className="section-eyebrow">SCHEDULE</div>
        <div className="section-title">{t.eventsTitle}</div>
        <div className="section-body">{t.eventsBody}</div>
      </div>

      {eventsLoading && <div className="events-status">…</div>}
      {!eventsLoading && eventsError && (
        <div className="events-status">
          {lang === 'ja' ? '読み込みに失敗しました。時間をおいて再度お試しください。' : 'Failed to load. Please try again shortly.'}
        </div>
      )}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="events-status">{lang === 'ja' ? '現在開催予定はありません。' : 'No upcoming retreats right now.'}</div>
      )}

      {!eventsLoading && events.length > 0 && (
        <div className="events-grid">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isSelected={selectedEventId === ev.id}
              onSelect={() => selectEvent(ev.id)}
              onOpenGallery={() => setGalleryEventId(ev.id)}
            />
          ))}
        </div>
      )}

      {galleryEvent && (
        <GalleryLightbox
          place={galleryEvent.place[lang]}
          images={galleryEvent.galleryUrls.length > 0 ? galleryEvent.galleryUrls : galleryEvent.thumbnailUrl ? [galleryEvent.thumbnailUrl] : []}
          onClose={() => setGalleryEventId(null)}
        />
      )}
    </section>
  );
}
