-- Supabase schema for NimblScale application data

-- Strategies created by users (inputs stored as JSONB)
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  inputs jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger strategies_updated_at
  before update on public.strategies
  for each row execute function public.set_updated_at();

-- App-level session records for analysis / reuse
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_data jsonb,
  created_at timestamptz default now()
);

-- AI generation logs: one row per call to /api/anthropic/generate
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  strategy_name text,
  inputs jsonb,
  completion text,
  parsed jsonb,
  valid boolean,
  parse_error text,
  created_at timestamptz default now()
);

-- Subscriptions table to track Stripe subscriptions and link to users
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text,
  price_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Service-role key (used by all API routes) bypasses RLS automatically.
-- These policies protect against direct anon-key queries.

alter table public.strategies    enable row level security;
alter table public.user_sessions enable row level security;
alter table public.ai_logs       enable row level security;
alter table public.subscriptions enable row level security;

-- Users can only read/write their own strategies
create policy "strategies: own rows only"
  on public.strategies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only read/write their own sessions
create policy "user_sessions: own rows only"
  on public.user_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only read their own ai_logs (writes are service-role only)
create policy "ai_logs: own rows read-only"
  on public.ai_logs for select
  using (auth.uid() = user_id);

-- Users can only read their own subscription (writes are service-role only via webhook)
create policy "subscriptions: own rows read-only"
  on public.subscriptions for select
  using (auth.uid() = user_id);
