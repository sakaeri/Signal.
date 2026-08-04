import { useEffect, useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import './GalleryLightbox.css';

const SLIDES_PER_EVENT = 3;

export default function GalleryLightbox({ place, onClose }: { place: string; onClose: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);

  const next = () => setSlideIndex((i) => (i + 1) % SLIDES_PER_EVENT);
  const prev = () => setSlideIndex((i) => (i - 1 + SLIDES_PER_EVENT) % SLIDES_PER_EVENT);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: SLIDES_PER_EVENT }, (_, i) => (
          <div
            key={i}
            className="lightbox-slide"
            style={{ display: i === slideIndex ? 'block' : 'none' }}
          >
            <ImagePlaceholder caption={`${place} — ${i + 1}`} />
          </div>
        ))}
        <button type="button" aria-label="Previous photo" className="lightbox-arrow lightbox-arrow-prev" onClick={prev}>
          ‹
        </button>
        <button type="button" aria-label="Next photo" className="lightbox-arrow lightbox-arrow-next" onClick={next}>
          ›
        </button>
      </div>
      <div className="lightbox-dots" onClick={(e) => e.stopPropagation()}>
        {Array.from({ length: SLIDES_PER_EVENT }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            className={`lightbox-dot${i === slideIndex ? ' is-active' : ''}`}
            onClick={() => setSlideIndex(i)}
          />
        ))}
      </div>
      <button type="button" className="lightbox-close" onClick={onClose}>
        CLOSE ✕
      </button>
    </div>
  );
}
