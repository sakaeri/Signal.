# Signal.

Bilingual (JA/EN) landing page for Signal. digital-detox retreats — event listing, application form, and payment.

## Stack

- React + TypeScript + Vite
- Supabase (application submissions)
- Stripe Elements (payment UI)
- Deploys to Vercel

## Setup

```bash
npm install
cp .env.example .env   # then fill in the two values below
npm run dev
```

### Environment variables

| Variable | Where to get it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon public key |

The Supabase project needs an `applications` table with insert-only RLS for the `anon` role — see the SQL used to create it in project notes, or ask for it again if needed.

### Stripe

`src/lib/stripe.ts` currently ships a placeholder `STRIPE_PUBLISHABLE_KEY`. Replace it with a real `pk_test_…`/`pk_live_…` key to switch the payment section from plain fallback fields to real Stripe Elements automatically.

Note: taking an actual payment still needs a server-side step (create a PaymentIntent with your Stripe *secret* key) — a Supabase Edge Function is a natural place for that once you're ready to accept real payments.

## Deploy

Push to GitHub, then import the repo on [vercel.com](https://vercel.com) (auto-detects Vite) and add the two `VITE_SUPABASE_*` env vars in the project's settings.
