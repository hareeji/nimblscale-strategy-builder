# NimblScale — Next.js prototype scaffold

This workspace contains a minimal Next.js scaffold for NimblScale with Supabase authentication wiring.

Getting started

1. Copy `.env.example` to `.env.local` and fill in your Supabase and Stripe credentials.

2. Install dependencies:

```bash
npm install
```

3. Run the dev server:

```bash
npm run dev
```

What's included

- Basic Next.js scaffold
- `lib/supabaseClient.js` — Supabase client wrapper
- `pages/auth.js` — Sign-in / Sign-up UI using Supabase
- `db/supabase_schema.sql` — SQL with initial tables for `strategies` and `user_sessions`

Next steps

- Implement server-side session handling and secure API routes
- Add Stripe subscription gating and webhooks
- Integrate Anthropic calls server-side for strategy generation
