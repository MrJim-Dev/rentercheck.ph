-- 1. Create public.users table (Mirror of auth.users)
-- We use IF NOT EXISTS just in case, but based on your dump it wasn't there.
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS logic safely
alter table public.users enable row level security;

-- Policies (Drop first to avoid "policy already exists" error if re-running)
drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" 
  on public.users for update 
  using (auth.uid() = id);

-- 2. Create Credits System Tables

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) not null unique,
  balance int not null default 0,
  currency text default 'PHP',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.credit_wallets enable row level security;

drop policy if exists "Users can view their own wallet" on public.credit_wallets;
create policy "Users can view their own wallet" 
  on public.credit_wallets for select 
  using (auth.uid() = user_id);

-- Transaction Type Enum
do $$ begin
    create type transaction_type as enum ('purchase', 'usage', 'refund', 'bonus', 'expiry');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.credit_wallets(id) not null,
  amount int not null, 
  type transaction_type not null,
  reference_id text,
  description text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_credit_transactions_wallet_id on public.credit_transactions(wallet_id);

alter table public.credit_transactions enable row level security;

drop policy if exists "Users can view their own transactions" on public.credit_transactions;
create policy "Users can view their own transactions" 
  on public.credit_transactions for select 
  using (
    exists (
      select 1 from public.credit_wallets w
      where w.id = public.credit_transactions.wallet_id
      and w.user_id = auth.uid()
    )
  );

-- 3. Functions and Triggers
-- (We use CREATE OR REPLACE so updates to logic apply immediately)

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_wallet_id uuid;
begin
  -- 1. Create public user profile
  -- We include ON CONFLICT DO NOTHING to handle users who already exist
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', ''), 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- 2. Create credit wallet if not exists
  if not exists (select 1 from public.credit_wallets where user_id = new.id) then
      insert into public.credit_wallets (user_id, balance)
      values (new.id, 50) -- Grant 50 credits
      returning id into v_wallet_id;

      -- 3. Log the "Signup Bonus" transaction
      insert into public.credit_transactions (wallet_id, amount, type, description)
      values (v_wallet_id, 50, 'bonus', 'Welcome Bonus: 50 Free Credits');
  end if;

  return new;
exception when others then
  raise warning 'Error in handle_new_user: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Drop first to ensure clean state
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atomic Function to Consume Credits
create or replace function consume_credits(
  p_amount int,
  p_description text,
  p_reference_id text default null,
  p_type transaction_type default 'usage'
) returns int as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet_id uuid;
  v_current_balance int;
  v_new_balance int;
begin
  -- 1. Lock the wallet row
  select id, balance into v_wallet_id, v_current_balance
  from public.credit_wallets
  where user_id = v_user_id
  for update;

  if not found then
    raise exception 'Wallet not found for user';
  end if;

  -- 2. Check sufficient funds
  if v_current_balance < p_amount then
    raise exception 'Insufficient credits. Current balance: %, Required: %', v_current_balance, p_amount;
  end if;

  v_new_balance := v_current_balance - p_amount;

  -- 3. Insert transaction log
  insert into public.credit_transactions (wallet_id, amount, type, description, reference_id)
  values (v_wallet_id, -p_amount, p_type, p_description, p_reference_id);

  -- 4. Update cached balance
  update public.credit_wallets
  set balance = v_new_balance,
      updated_at = now()
  where id = v_wallet_id;

  return v_new_balance;
end;
$$ language plpgsql security definer;
