-- ==========================================
-- BACKFILL SCRIPT FOR EXISTING USERS
-- Run this to fix "Old Accounts" not having credits
-- ==========================================

-- 1. Create missing entries in public.users for existing auth.users
insert into public.users (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', ''), 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 2. Create missing credit_wallets with 50 Free Credits
-- This ensures everyone has a wallet
do $$
declare
  r record;
  v_wallet_id uuid;
begin
  for r in select id from public.users where id not in (select user_id from public.credit_wallets) loop
    
    insert into public.credit_wallets (user_id, balance)
    values (r.id, 50)
    returning id into v_wallet_id;

    -- Also log the bonus so we have a record
    insert into public.credit_transactions (wallet_id, amount, type, description)
    values (v_wallet_id, 50, 'bonus', 'Backfill Bonus: 50 Free Credits');
    
  end loop;
end;
$$;

-- 3. ENSURE the Refill RPC exists (in case it wasn't run earlier)
create or replace function refill_credits(
  p_amount int,
  p_description text
) returns int as $$
declare
  v_wallet_id uuid;
  v_new_balance int;
begin
  -- Update and get new balance
  update public.credit_wallets
  set balance = balance + p_amount, updated_at = now()
  where user_id = auth.uid()
  returning id, balance into v_wallet_id, v_new_balance;

  if v_wallet_id is null then
    raise exception 'Wallet not found. Please contact support.';
  end if;

  -- Log transaction
  insert into public.credit_transactions (wallet_id, amount, type, description)
  values (v_wallet_id, p_amount, 'bonus', p_description);

  return v_new_balance;
end;
$$ language plpgsql security definer;
