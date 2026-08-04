import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useBooking } from '../context/BookingContext';
import { RAW_EVENTS } from '../data/events';
import EventCard from './EventCard';
import GalleryLightbox from './GalleryLightbox';
import './Events.css';

export default function Events() {
  const { t, lang } = useLanguage();
  const { selectedEventId, selectEvent } = useBooking();
  const [galleryEventId, setGalleryEventId] = useState<string | null>(null);

  const galleryEvent = RAW_EVENTS.find((ev) => ev.id === galleryEventId) ?? null;

  return (
    <section id="events" className="events-section">
      <div className="section-header">
        <div className="section-eyebrow">SCHEDULE</div>
        <div className="section-title">{t.eventsTitle}</div>
        <div className="section-body">{t.eventsBody}</div>
      </div>
      <div className="events-grid">
        {RAW_EVENTS.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            isSelected={selectedEventId === ev.id}
            onSelect={() => selectEvent(ev.id)}
            onOpenGallery={() => setGalleryEventId(ev.id)}
          />
        ))}
      </div>
      {galleryEvent && (
        <GalleryLightbox place={galleryEvent[lang].place} onClose={() => setGalleryEventId(null)} />
      )}
    </section>
  );
}
