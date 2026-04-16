-- Balancio — Supabase schema
-- Run this in your Supabase project's SQL editor (supabase.com → SQL editor)

-- Enable auth.users (already exists by default in Supabase)

-- Friends
create table if not exists public.friends (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Transactions
create table if not exists public.transactions (
  id             text        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  friend_id      text        not null,
  type           text        not null check (type in ('lent', 'received')),
  amount         numeric(12, 2) not null check (amount > 0),
  date           text        not null,
  payment_method text        not null,
  note           text,
  created_at     timestamptz not null default now()
);

-- Indexes
create index if not exists friends_user_id_idx      on public.friends(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_friend_id_idx on public.transactions(friend_id);

-- Row Level Security
alter table public.friends      enable row level security;
alter table public.transactions enable row level security;

-- Policies: users only see/modify their own data
create policy "users_own_friends" on public.friends
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable email magic link auth in Supabase dashboard:
-- Authentication → Providers → Email → enable "Magic Link"
