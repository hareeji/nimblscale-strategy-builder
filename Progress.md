## What has been built so far

- Next.js app scaffold created for `NimblScale Strategy Builder`
- Supabase integration with client and server helpers
- Auth UI implemented for sign-in/sign-up
- Supabase DB schema defined for strategies, sessions, subscriptions
- Pricing page and Stripe checkout flow added
- Stripe webhook route wired to sync subscription state to Supabase
- Protected subscriber status UI created
- Subscription-gated strategy workflow page built
- Strategy inputs persisted to Supabase as drafts
- AI-driven workflow with Anthropic prompt and strict JSON schema built
- AJV validation + retry for Anthropic JSON parsing
- Anthropic API migrated from legacy `/v1/complete` to `/v1/messages` (claude-haiku-4-5-20251001)
- AI generation endpoint auth-gated (requires valid session + active subscription)
- Stripe webhook user lookup fixed (metadata user ID → subscription lookup → email fallback)
- Supabase `.insert()` fixed to return inserted row via `.select()`
- Draft naming — user-defined name input on strategy workflow
- Draft detail page made fully editable (step-by-step form with save, AI generate, export)
- Delete draft — DELETE API handler + confirm button on drafts list
- Strategy export to formatted `.txt` download
- Branded design system — CSS tokens, sidebar layout, component classes applied across all pages
- `.env.example` documented with all required keys
- Supabase JS client upgraded to v2.106.2 to support new `sb_publishable_` key format
- Git repository initialised and pushed to GitHub (hareeji/nimblscale-strategy-builder)

## What is incomplete

- Middleware guard for subscriber-only routes
- AI completion and parse-failure logging
- Vercel deployment config
- Basic tests for API routes and UI flows
- Supabase schema applied to live project (run db/supabase_schema.sql in SQL Editor)
- Stripe keys and Anthropic API key still needed in .env.local