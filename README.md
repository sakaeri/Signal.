# Signal.

Bilingual (JA/EN) landing page for Signal. digital-detox retreats — event listing, application form, payment, and an admin dashboard.

## Stack

- React + TypeScript + Vite
- React Router (`/` public site, `/admin` dashboard)
- Supabase (events, event/site images, applications, auth)
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

### Database schema

The Supabase project needs: `events`, `event_images`, `site_images`, and `applications` tables, RLS policies (public read on events/images, insert-only on applications for `anon`, full access for `authenticated`), and a public `media` storage bucket. Ask for the setup SQL again if you don't have it on hand.

### Admin dashboard (`/admin`)

Sign-in uses Supabase Auth (email/password). Create the admin user yourself in the Supabase dashboard: **Authentication → Users → Add user**. From the dashboard you can:

- **イベント** — create/edit/delete events, upload each event's thumbnail + gallery photos
- **申し込み** — view submitted applications, filter by event, export CSV
- **写真** — override the hero carousel and journey-step photos (falls back to the bundled defaults until you upload a replacement)

### Stripe

`src/lib/stripe.ts` currently ships a placeholder `STRIPE_PUBLISHABLE_KEY`. Replace it with a real `pk_test_…`/`pk_live_…` key to switch the payment section from plain fallback fields to real Stripe Elements automatically.

Note: taking an actual payment still needs a server-side step (create a PaymentIntent with your Stripe *secret* key) — a Supabase Edge Function is a natural place for that once you're ready to accept real payments.

## Deploy

Push to GitHub, then import the repo on [vercel.com](https://vercel.com) (auto-detects Vite) and add the two `VITE_SUPABASE_*` env vars in the project's settings. `vercel.json` rewrites all routes to `index.html` so `/admin` works on direct load/refresh.
