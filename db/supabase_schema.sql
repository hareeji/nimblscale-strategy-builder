-- Supabase schema for NimblScale application data

-- Strategies created by users (inputs stored as JSONB)
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  inputs jsonb,
  created_at timestamptz default now()
);

-- App-level session records for analysis / reuse
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_data jsonb,
  created_at timestamptz default now()
);

-- Subscriptions table to track Stripe subscriptions and link to users
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text,
  price_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
