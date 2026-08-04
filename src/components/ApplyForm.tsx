import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useBooking } from '../context/BookingContext';
import { useSiteData } from '../context/SiteDataContext';
import { COUNTRY_OPTIONS } from '../i18n/translations';
import { submitApplication } from '../lib/api';
import { isStripeConfigured } from '../lib/stripe';
import PaymentSection from './PaymentSection';
import './ApplyForm.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  country: string;
  phone: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  message: string;
  card: string;
  expiry: string;
  cvc: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  country: '',
  phone: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  message: '',
  card: '',
  expiry: '',
  cvc: '',
};

export default function ApplyForm() {
  const { t, lang } = useLanguage();
  const { selectedEventId, setSelectedEventId } = useBooking();
  const { events } = useSiteData();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [paymentReady, setPaymentReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eventId = selectedEventId ?? '';
  const selectedEvent = events.find((ev) => ev.id === eventId) ?? null;
  const amountJpy = selectedEvent ? selectedEvent.price : 0;

  const eventOptions = events.map((ev) => ({
    id: ev.id,
    label: `${ev.title[lang]} (${ev.dateLabel[lang]})`,
  }));

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const paymentIsReady = isStripeConfigured
    ? paymentReady
    : form.card.trim() !== '' && form.expiry.trim() !== '' && form.cvc.trim() !== '';

  const canSubmit = Boolean(
    eventId &&
      form.name.trim() &&
      EMAIL_RE.test(form.email) &&
      form.country &&
      form.phone.trim() &&
      form.emergencyName.trim() &&
      form.emergencyRelation.trim() &&
      form.emergencyPhone.trim() &&
      paymentIsReady,
  );

  // Reset per-payment-method readiness whenever the selected event (and thus amount) changes.
  useEffect(() => {
    setPaymentReady(false);
  }, [eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplication({
        eventId,
        name: form.name,
        email: form.email,
        country: form.country,
        phone: form.phone,
        emergencyName: form.emergencyName,
        emergencyRelation: form.emergencyRelation,
        emergencyPhone: form.emergencyPhone,
        message: form.message,
      });
      setSubmitted(true);
    } catch {
      setSubmitError(lang === 'ja' ? '送信に失敗しました。もう一度お試しください。' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="apply" className="apply-section">
      <div className="apply-inner">
        <div className="section-header">
          <div className="section-eyebrow">APPLICATION</div>
          <div className="section-title">{t.applyTitle}</div>
          <div className="section-body">{t.applyBody}</div>
        </div>

        {submitted ? (
          <div className="apply-success">
            <div className="apply-success-check">✓</div>
            <div className="apply-success-title">{t.successTitle}</div>
            <div className="apply-success-body">{t.successBody}</div>
          </div>
        ) : (
          <form className="apply-form" onSubmit={handleSubmit}>
            <div className="apply-field">
              <label className="apply-label" htmlFor="event">
                {t.labelEvent}
              </label>
              <select
                id="event"
                className="apply-select"
                value={eventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="">{t.selectPlaceholder}</option>
                {eventOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="name">
                {t.labelName}
              </label>
              <input id="name" type="text" className="apply-input" placeholder={t.placeholderName} {...field('name')} />
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="email">
                {t.labelEmail}
              </label>
              <input id="email" type="email" className="apply-input" placeholder="you@example.com" {...field('email')} />
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="country">
                {t.labelCountry}
              </label>
              <select id="country" className="apply-select" {...field('country')}>
                <option value="">{t.selectPlaceholder}</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="phone">
                {t.labelPhone}
              </label>
              <input id="phone" type="tel" className="apply-input" placeholder={t.placeholderPhone} {...field('phone')} />
              <div className="apply-hint">{t.phoneHint}</div>
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="emergencyName">
                {t.labelEmergencyName}
              </label>
              <input
                id="emergencyName"
                type="text"
                className="apply-input"
                placeholder={t.placeholderEmergencyName}
                {...field('emergencyName')}
              />
            </div>

            <div className="apply-field-row">
              <div className="apply-field">
                <label className="apply-label" htmlFor="emergencyRelation">
                  {t.labelEmergencyRelation}
                </label>
                <input
                  id="emergencyRelation"
                  type="text"
                  className="apply-input"
                  placeholder={t.placeholderEmergencyRelation}
                  {...field('emergencyRelation')}
                />
              </div>
              <div className="apply-field">
                <label className="apply-label" htmlFor="emergencyPhone">
                  {t.labelEmergencyPhone}
                </label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  className="apply-input"
                  placeholder={t.placeholderPhone}
                  {...field('emergencyPhone')}
                />
              </div>
            </div>

            <div className="apply-field">
              <label className="apply-label" htmlFor="message">
                {t.labelMessage}
              </label>
              <textarea id="message" className="apply-textarea" rows={2} placeholder={t.placeholderMessage} {...field('message')} />
            </div>

            {selectedEvent && (
              <div className="apply-payment-summary">
                <span className="apply-payment-summary-label">{t.paymentAmountLabel}</span>
                <span className="apply-payment-summary-amount">¥{selectedEvent.price.toLocaleString('en-US')}</span>
              </div>
            )}

            <PaymentSection
              amountJpy={amountJpy}
              onReadyChange={setPaymentReady}
              fallback={{
                card: form.card,
                expiry: form.expiry,
                cvc: form.cvc,
                onCardChange: (v) => setForm((f) => ({ ...f, card: v })),
                onExpiryChange: (v) => setForm((f) => ({ ...f, expiry: v })),
                onCvcChange: (v) => setForm((f) => ({ ...f, cvc: v })),
              }}
            />

            <button type="submit" className="apply-submit" disabled={!canSubmit || submitting}>
              {submitting ? '…' : t.submitLabel}
            </button>
            {submitError && <div className="apply-submit-error">{submitError}</div>}
            <div className="apply-submit-note">{t.submitNote}</div>
          </form>
        )}
      </div>
    </section>
  );
}
