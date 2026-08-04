import { useMemo } from 'react';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import type { StripeElementsOptionsMode } from '@stripe/stripe-js';
import { useLanguage } from '../i18n/LanguageContext';
import { getStripe, isStripeConfigured } from '../lib/stripe';
import './ApplyForm.css';

interface PaymentSectionProps {
  amountJpy: number;
  onReadyChange: (ready: boolean) => void;
  fallback: {
    card: string;
    expiry: string;
    cvc: string;
    onCardChange: (v: string) => void;
    onExpiryChange: (v: string) => void;
    onCvcChange: (v: string) => void;
  };
}

const APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#2E3A2A',
    colorText: '#2A2A24',
    colorDanger: '#b3452f',
    fontFamily: "'Zen Kaku Gothic New', sans-serif",
    borderRadius: '4px',
  },
};

function StripeFields({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  return (
    <div className="apply-payment-element-wrap">
      <PaymentElement
        options={{ layout: 'tabs' }}
        onChange={(e) => onReadyChange(e.complete)}
      />
    </div>
  );
}

function FallbackFields({ fallback }: { fallback: PaymentSectionProps['fallback'] }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="apply-payment-notice">
        Stripe publishable key not configured yet (src/lib/stripe.ts) — showing plain fields as a
        placeholder. Set STRIPE_PUBLISHABLE_KEY to switch to real Stripe Elements automatically.
      </div>
      <div className="apply-field">
        <label className="apply-label" htmlFor="card">
          {t.labelCard}
        </label>
        <input
          id="card"
          type="text"
          className="apply-input"
          value={fallback.card}
          onChange={(e) => fallback.onCardChange(e.target.value)}
          placeholder="1234 5678 9012 3456"
        />
      </div>
      <div className="apply-field-row">
        <div className="apply-field">
          <label className="apply-label" htmlFor="expiry">
            {t.labelExpiry}
          </label>
          <input
            id="expiry"
            type="text"
            className="apply-input"
            value={fallback.expiry}
            onChange={(e) => fallback.onExpiryChange(e.target.value)}
            placeholder="MM / YY"
          />
        </div>
        <div className="apply-field">
          <label className="apply-label" htmlFor="cvc">
            {t.labelCvc}
          </label>
          <input
            id="cvc"
            type="text"
            className="apply-input"
            value={fallback.cvc}
            onChange={(e) => fallback.onCvcChange(e.target.value)}
            placeholder="CVC"
          />
        </div>
      </div>
    </>
  );
}

export default function PaymentSection({ amountJpy, onReadyChange, fallback }: PaymentSectionProps) {
  const { t } = useLanguage();

  const options: StripeElementsOptionsMode = useMemo(
    () => ({
      mode: 'payment',
      amount: Math.max(amountJpy, 1),
      currency: 'jpy',
      appearance: APPEARANCE,
    }),
    [amountJpy],
  );

  return (
    <>
      <div className="apply-payment-info-label">{t.paymentInfoLabel}</div>
      {isStripeConfigured ? (
        <Elements key={amountJpy} stripe={getStripe()} options={options}>
          <StripeFields onReadyChange={onReadyChange} />
        </Elements>
      ) : (
        <FallbackFields fallback={fallback} />
      )}
    </>
  );
}
