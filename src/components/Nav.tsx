import { useLanguage } from '../i18n/LanguageContext';
import './Nav.css';

export default function Nav() {
  const { t, lang, toggleLang } = useLanguage();

  return (
    <nav className="nav">
      <div className="nav-logo">Signal.</div>
      <div className="nav-links">
        <a href="#events" className="nav-link">
          {t.navEvents}
        </a>
        <a href="#about" className="nav-link">
          {t.navAbout}
        </a>
        <a href="#faq" className="nav-link">
          {t.navFaq}
        </a>
        <a href="#apply" className="nav-cta">
          {t.navApply}
        </a>
        <button type="button" className="nav-lang-toggle" onClick={toggleLang}>
          {lang === 'ja' ? 'English' : '日本語'}
        </button>
      </div>
    </nav>
  );
}
