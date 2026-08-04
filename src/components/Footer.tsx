import { useLanguage } from '../i18n/LanguageContext';
import './Footer.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-logo">Signal.</div>
      <div className="footer-contact">
        {t.footerOrganizer}
        <br />
        {t.footerContact}
      </div>
      <a
        href="https://instagram.com/signal.retreat"
        target="_blank"
        rel="noreferrer"
        className="footer-instagram"
        aria-label="Instagram"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <div className="footer-copyright">{t.footerCopyright}</div>
    </footer>
  );
}
