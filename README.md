# drive-finder

**"Find Me A Driving Instructor"** — $19 concierge service matching Singapore learners with vetted, high-pass-rate private driving instructors within 48 hours.

## Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- better-sqlite3 (local DB, zero config)
- Stripe (manual capture / auth-hold — no refunds, no fees on failures)
- Resend (transactional emails)

## How the money flow works

This service uses **Stripe manual capture** (auth-hold). No money moves until we deliver:

1. Learner submits form + card details → Stripe places a hold on $19
2. We have 48h to WhatsApp them 2–3 vetted, available instructor matches
3. If we deliver → we capture the hold → $19 comes to us
4. If we fail (or 48h elapse) → we void the hold → $0 fees, no refund

This is legally cleaner and financially safer than charge-and-refund.

## Running locally

```bash
npm install
npm run seed        # seed 18 vetted instructors from SPF pass rate data
npm run dev         # http://localhost:3005
```

## Environment

Copy `.env.example` to `.env.local` and fill in:
- Stripe **test** keys from https://dashboard.stripe.com/test/apikeys
- Resend key (already reused from Strata)

## Admin

- Admin dashboard: http://localhost:3005/admin
- Password: whatever you set in `ADMIN_PASSWORD`

## Routes

- `/` — landing page + form
- `/success?id=X` — post-submission confirmation
- `/admin` — Don's dashboard to manage requests
- `/terms`, `/privacy` — legal pages

## API

- `POST /api/request` — create request + auth-hold
- `GET /api/admin/list` — list all requests (admin only)
- `POST /api/admin/deliver` — mark delivered + capture payment
- `POST /api/admin/fail` — mark failed + void auth
- `GET /api/cron/void-stale` — auto-void requests older than 48h (call from Vercel Cron)
