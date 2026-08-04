import { useLanguage } from '../i18n/LanguageContext';
import type { RawEvent } from '../data/events';
import ImagePlaceholder from './ImagePlaceholder';
import './Events.css';

interface EventCardProps {
  event: RawEvent;
  isSelected: boolean;
  onSelect: () => void;
  onOpenGallery: () => void;
}

export default function EventCard({ event, isSelected, onSelect, onOpenGallery }: EventCardProps) {
  const { lang, t } = useLanguage();
  const copy = event[lang];
  const checkinTime = event.checkinTime[lang];
  const checkinPlace = event.shuttle ? t.meetShuttleValue : t.meetOnsiteValue;
  const remainingLabel = lang === 'ja' ? `残り${event.capacity}名` : `${event.capacity} left`;
  const buttonLabel = isSelected ? (lang === 'ja' ? '選択中' : 'Selected') : remainingLabel;

  return (
    <div className="event-card">
      <button type="button" className="event-card-image" onClick={onOpenGallery} aria-label={`View photos of ${copy.place}`}>
        <ImagePlaceholder caption={copy.place} />
        <div className="event-card-date-badge">{copy.dateLabel}</div>
      </button>
      <div className="event-card-body">
        <div className="event-card-place">{copy.place}</div>
        <div className="event-card-title">{copy.title}</div>
        <div className="event-card-checkin">
          {t.checkinLabel} {checkinTime} ({checkinPlace})
        </div>
        <div className="event-card-footer">
          <span className="event-card-price">¥{event.price}/人</span>
          <button
            type="button"
            className={`event-card-select${isSelected ? ' is-selected' : ''}`}
            onClick={onSelect}
          >
            {buttonLabel} ▼
          </button>
        </div>
      </div>
    </div>
  );
}
