import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { getFaqItems } from '../data/faq';
import BackToTop from './BackToTop';
import './Faq.css';

export default function Faq() {
  const { t, lang } = useLanguage();
  const items = getFaqItems(lang);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="faq-section">
      <BackToTop />
      <div className="faq-inner">
        <div className="section-header">
          <div className="section-eyebrow">FAQ</div>
          <div className="section-title">{t.faqTitle}</div>
        </div>
        <div className="faq-list">
          {items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div className="faq-item" key={idx}>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span className="faq-question-icon">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <div className="faq-answer">{item.answer}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
