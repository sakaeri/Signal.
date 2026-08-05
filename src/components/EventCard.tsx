import { useLanguage } from '../i18n/LanguageContext';
import type { EventRecord } from '../types/event';
import ImagePlaceholder from './ImagePlaceholder';
import './Events.css';

interface EventCardProps {
  event: EventRecord;
  isSelected: boolean;
  onSelect: () => void;
  onOpenGallery: () => void;
}

export default function EventCard({ event, isSelected, onSelect, onOpenGallery }: EventCardProps) {
  const { lang, t } = useLanguage();
  const title = event.title[lang];
  const place = event.place[lang];
  const dateLabel = event.dateLabel[lang];
  const checkinTime = event.checkinTime[lang];
  const checkinPlace = event.shuttle ? t.meetShuttleValue : t.meetOnsiteValue;
  const isSoldOut = event.remaining <= 0;
  const remainingLabel = lang === 'ja' ? `残り${event.remaining}名` : `${event.remaining} left`;
  const buttonLabel = isSoldOut ? t.soldOutLabel : isSelected ? (lang === 'ja' ? '選択中' : 'Selected') : remainingLabel;

  return (
    <div className="event-card">
      <button type="button" className="event-card-image" onClick={onOpenGallery} aria-label={`View photos of ${place}`}>
        {event.thumbnailUrl ? <img src={event.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <ImagePlaceholder caption={place} />}
        <div className="event-card-date-badge">{dateLabel}</div>
      </button>
      <div className="event-card-body">
        <div className="event-card-place">{place}</div>
        <div className="event-card-title">{title}</div>
        <div className="event-card-checkin">
          {t.checkinLabel} {checkinTime} ({checkinPlace})
        </div>
        <div className="event-card-footer">
          <span className="event-card-price">¥{event.price.toLocaleString('en-US')}/人</span>
          <button
            type="button"
            className={`event-card-select${isSelected ? ' is-selected' : ''}`}
            onClick={onSelect}
            disabled={isSoldOut}
          >
            {buttonLabel} {!isSoldOut && '▼'}
          </button>
        </div>
      </div>
    </div>
  );
}
