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
- `@supabase/ssr` installed; `lib/supabaseClient.js` switched to `createBrowserClient` for cookie-based session storage (required for server-side middleware to read auth state)
- Middleware guard — `middleware.js` created at root; protects `/strategy`, `/drafts`, `/drafts/:path*`, `/account`; unauthenticated visitors redirected to `/auth?next=<path>`
- Auth page updated to redirect back to the original destination after sign-in (respects `?next=` param)
- AI logging — every `/api/anthropic/generate` call inserts a row into `ai_logs` (user, inputs, completion, parsed output, validity, AJV errors); fire-and-forget, never blocks the response
- `db/supabase_schema.sql` updated with `ai_logs` table definition
- `vercel.json` created — sets 30 s timeout on AI generation function, 10 s on Stripe webhook

- Jest test suite added (jest + @testing-library/react + jest-dom); 24 tests across 5 suites covering strategy CRUD, subscription status, and auth UI
- `npm test` script added to package.json

- `db/supabase_schema.sql` hardened: added `updated_at` + auto-update trigger to `strategies`, unique constraint on `subscriptions.stripe_subscription_id`, and RLS policies for all four tables

## What is incomplete
- Supabase schema applied to live project (run db/supabase_schema.sql in SQL Editor — this is a full replacement, safe to re-run)
- Stripe keys and Anthropic API key still needed in .env.local and Vercel env vars