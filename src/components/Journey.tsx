import { useLanguage } from '../i18n/LanguageContext';
import { getFlowSteps } from '../data/flowSteps';
import './Journey.css';

export default function Journey() {
  const { t, lang } = useLanguage();
  const steps = getFlowSteps(lang);

  return (
    <section id="journey" className="journey-section">
      <div className="journey-header">
        <div className="section-eyebrow">THE FLOW</div>
        <div className="journey-title">{t.flowTitle}</div>
      </div>
      <div className="journey-list">
        {steps.map((step) => (
          <div className="journey-step" key={step.num}>
            <div className="journey-step-rail">
              <div className="journey-step-num">{step.num}</div>
              {step.hasNext && <div className="journey-step-line" />}
            </div>
            <div className="journey-step-copy">
              <div className="journey-step-eyebrow">{step.eyebrow}</div>
              <div className="journey-step-body">{step.body}</div>
            </div>
            <div className="journey-step-image">
              <img src={step.image} alt="" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
