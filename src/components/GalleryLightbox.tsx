import { useEffect, useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import './GalleryLightbox.css';

interface GalleryLightboxProps {
  place: string;
  images: string[];
  onClose: () => void;
}

export default function GalleryLightbox({ place, images, onClose }: GalleryLightboxProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const count = Math.max(images.length, 1);

  const next = () => setSlideIndex((i) => (i + 1) % count);
  const prev = () => setSlideIndex((i) => (i - 1 + count) % count);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, count]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {images.length === 0 ? (
          <div className="lightbox-slide" style={{ display: 'block' }}>
            <ImagePlaceholder caption={place} />
          </div>
        ) : (
          images.map((src, i) => (
            <div key={src} className="lightbox-slide" style={{ display: i === slideIndex ? 'block' : 'none' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))
        )}
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous photo" className="lightbox-arrow lightbox-arrow-prev" onClick={prev}>
              ‹
            </button>
            <button type="button" aria-label="Next photo" className="lightbox-arrow lightbox-arrow-next" onClick={next}>
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="lightbox-dots" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              className={`lightbox-dot${i === slideIndex ? ' is-active' : ''}`}
              onClick={() => setSlideIndex(i)}
            />
          ))}
        </div>
      )}
      <button type="button" className="lightbox-close" onClick={onClose}>
        CLOSE ✕
      </button>
    </div>
  );
}
