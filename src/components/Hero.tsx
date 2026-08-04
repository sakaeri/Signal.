import { useLanguage } from '../i18n/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { HERO_IMAGES, HERO_SLOTS } from '../data/heroImages';
import { useCarousel } from '../hooks/useCarousel';
import './Hero.css';

export default function Hero() {
  const { t } = useLanguage();
  const { siteImages } = useSiteData();
  const { index, setIndex, next, prev, pause, resume } = useCarousel(HERO_IMAGES.length, 5000);
  const images = HERO_SLOTS.map((slot, i) => siteImages[slot] ?? HERO_IMAGES[i]);

  return (
    <div className="hero-outer">
      <div className="hero-frame" onMouseEnter={pause} onMouseLeave={resume}>
        <div className="hero-viewport">
          <img key={index} className="hero-image" src={images[index]} alt="" />
          <div className="hero-scrim" />
          <div className="hero-copy">
            <div className="hero-title">
              {t.heroTitleLine1}
              <br />
              {t.heroTitleLine2}
            </div>
            <div className="hero-ctas">
              <a href="#about" className="hero-cta-outline">
                {t.ctaAbout}
              </a>
              <a href="#events" className="hero-cta-solid">
                {t.ctaEvents}
              </a>
            </div>
          </div>
          <button
            type="button"
            aria-label="Previous"
            className="hero-arrow hero-arrow-prev"
            onClick={prev}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="#F6F2EA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next"
            className="hero-arrow hero-arrow-next"
            onClick={next}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6l6 6-6 6"
                stroke="#F6F2EA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="hero-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              className={`hero-dot${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
