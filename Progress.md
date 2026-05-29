# NimblScale Strategy Builder — Progress

## What has been built

### Authentication
- Sign-in, sign-up, and sign-out flows via Supabase Auth
- Forgot password and email-based recovery (redirects back to `/auth`)
- Middleware guard (`proxy.js`) protects `/strategy`, `/drafts`, `/account` — unauthenticated visitors redirected to `/auth?next=<path>`
- Auth page respects `?next=` param and redirects back after sign-in
- Sign-out button in the topbar, available on every page

### Strategy Workflow
- 5-step strategy builder: Business Context, Competitive Advantage, Target Audience, Strategic Initiatives, Metrics & Outcomes
- Draft naming with user-defined title
- Step-by-step navigation (Previous / Next tabs)
- Save draft to Supabase at any point
- AI summary generation via Anthropic (`claude-haiku-4-5-20251001`, `/v1/messages`)
  - Strict JSON schema enforced with AJV validation
  - Automatic retry if first response fails schema validation
  - "Populate fields from AI" — maps AI output back into form fields
  - "Save AI summary to draft" — persists AI output alongside inputs
- Export strategy to formatted `.txt` download

### Drafts
- Drafts list page with last-updated timestamps
- Open any draft for full editing (step tabs, save, AI generate, export, populate from AI)
- Delete draft with confirmation (irreversible)

### Subscription & Billing
- Pricing page with Stripe Checkout (Pro Plan, $29/month)
- Stripe webhook syncs subscription state to Supabase (`subscriptions` table) on: checkout completed, subscription updated/deleted, payment succeeded/failed
- Webhook user resolution: metadata user ID → customer ID lookup → email fallback
- Subscription-gated access: `/strategy` and `/drafts` redirect to `/pricing` if no active subscription
- Account page shows subscription status badge, price ID, and last updated
- Stripe Customer Portal: "Manage subscription" button on account page (cancel, update payment method)
- Home page shows "Subscription activated" banner after successful checkout (`?subscribed=1`)

### API Routes
| Route | Methods | Description |
|---|---|---|
| `/api/auth/me` | GET | Returns current user |
| `/api/subscriptions/status` | GET | Returns user + latest subscription |
| `/api/strategies/save` | POST | Create new draft |
| `/api/strategies/list` | GET | List all drafts for user |
| `/api/strategies/[id]` | GET / PATCH / DELETE | Read, update, or delete a draft |
| `/api/anthropic/generate` | POST | AI strategy generation (subscription-gated) |
| `/api/stripe/create-checkout-session` | POST | Create Stripe Checkout session |
| `/api/stripe/create-portal-session` | POST | Create Stripe Customer Portal session |
| `/api/stripe/webhook` | POST | Receive and process Stripe events |

### Database
- `strategies` — user drafts (JSONB inputs, name, timestamps, auto-update trigger)
- `subscriptions` — Stripe subscription state linked to users
- `ai_logs` — every AI generation call logged (inputs, completion, parsed output, AJV validity)
- `user_sessions` — reserved for future use
- Row Level Security enabled on all four tables; service-role key bypasses for API routes
- Unique constraint on `subscriptions.stripe_subscription_id`

### Infrastructure & Quality
- Branded design system: CSS tokens, sidebar layout, step tabs, panel/card/button classes
- `lib/steps.js` — shared step definitions imported by both strategy pages (no duplication)
- `lib/supabaseClient.js` — `createBrowserClient` from `@supabase/ssr` for cookie-based sessions
- `lib/supabaseServer.js` — service-role admin client with fully-chainable noop fallback when env vars are missing
- `vercel.json` — 30 s timeout on AI generation, 10 s on Stripe webhook
- `.env.example` documents all required environment variables
- Jest test suite: 29 tests across 6 suites (strategy CRUD, subscriptions, auth UI, Stripe portal)

---

## End-to-end verification results

Tested against the live Supabase project with the dev server running. Supabase credentials are set; Stripe and Anthropic keys are not yet filled in.

| Flow | Result | Notes |
|---|---|---|
| Dev server, page rendering | ✅ | All pages return 200 |
| Middleware auth redirects | ✅ | `/strategy`, `/drafts`, `/account` → `307 /auth?next=<path>` |
| API 401 on missing token | ✅ | All routes return `{"error":"Missing access token"}` |
| Sign-in (Supabase JWT) | ✅ | Returns valid ES256 token |
| `/api/auth/me` | ✅ | Returns correct user |
| `/api/subscriptions/status` | ❌ | 500 — schema not applied (table missing) |
| `/api/strategies/list` | ❌ | 500 — schema not applied (table missing) |
| `/api/strategies/save` | ❌ | 500 — schema not applied (table missing) |
| Stripe checkout | ❌ | 500 — `STRIPE_SECRET_KEY` is empty |
| AI generation | ⚠️ | 403 "Active subscription required" — DB error silently swallowed in subscription check |

**Known code issue found during verification:** `/api/anthropic/generate` does not check `subsErr` after the subscription query. When the `subscriptions` table is missing, the DB error is silently dropped and the route returns a misleading 403 instead of a 500. Needs a one-line fix before launch.

---

## What is incomplete

### Code fix applied

- **`/api/anthropic/generate` — subscription query error now surfaced correctly.** Added `subsErr` check; DB failures now return 500 instead of a misleading 403 "Active subscription required".

### Manual steps — requires your credentials / dashboard access

1. **Run the database schema**
   Open `db/supabase_schema.sql` in the Supabase SQL Editor and run it. Safe to re-run (uses `create table if not exists` and `create or replace function`). This unblocks all strategy, draft, and subscription routes.

2. **Fill in environment variables**
   Copy `.env.example` to `.env.local` and populate all values. Add the same keys to Vercel environment variables before deploying.
   Still missing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`, `ANTHROPIC_API_KEY`

3. **Activate Stripe Customer Portal**
   In the Stripe Dashboard: Billing → Customer portal → Activate. Required before the "Manage subscription" button on the account page will work.

4. **Register Stripe webhook endpoint**
   In the Stripe Dashboard: Developers → Webhooks → Add endpoint. Point it at `<your-app-url>/api/stripe/webhook`. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

5. **Enable "Auto-confirm users" in Supabase Auth settings for local testing**
   Prevents hitting the email send rate limit when creating test accounts during development.
