import { useLanguage } from '../i18n/LanguageContext';
import { getFeatures } from '../data/features';
import './About.css';

export default function About() {
  const { t, lang } = useLanguage();
  const features = getFeatures(lang);

  return (
    <section id="about" className="about-section">
      <div className="section-header">
        <div className="section-eyebrow">WHY SIGNAL.</div>
        <div className="section-title">{t.aboutTitle}</div>
        <div className="section-body">{t.aboutBody}</div>
      </div>
      <div className="about-features">
        {features.map((f) => (
          <div className="about-feature" key={f.num}>
            <div className="about-feature-badge">{f.num}</div>
            <div className="about-feature-title">{f.title}</div>
            <div className="about-feature-body">{f.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
