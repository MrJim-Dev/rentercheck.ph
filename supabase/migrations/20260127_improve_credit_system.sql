-- 1. Add action_type to credit_action_costs
ALTER TABLE public.credit_action_costs 
ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'deduction' CHECK (action_type IN ('deduction', 'addition'));

-- 2. Create Transaction Type Enum if not exists (already exists but for safety in future readers)
-- create type transaction_type as enum ('purchase', 'usage', 'refund', 'bonus', 'expiry', 'admin_adjustment');
-- Note: Enum modification in Postgres is tricky if it's already used. 
-- We'll just cast strictly or rely on text if we want flexibility, but let's try to add 'admin_adjustment' safely.
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'admin_adjustment';

-- 3. Update perform_cost_deduction to handle additions
CREATE OR REPLACE FUNCTION perform_cost_deduction(
  p_user_id uuid,
  p_action_key text,
  p_cost int,
  p_ref_id text default null
) RETURNS int AS $$
DECLARE
  v_wallet_id uuid;
  v_current_balance int;
  v_new_balance int;
  v_action_name text;
  v_action_type text;
  v_actual_cost int;
  v_trx_type transaction_type;
BEGIN
  -- 1. Lock Wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  -- 2. Get Action Details
  SELECT action_name, action_type INTO v_action_name, v_action_type
  FROM public.credit_action_costs 
  WHERE action_key = p_action_key;

  IF v_action_name IS NULL THEN
    v_action_name := p_action_key;
    v_action_type := 'deduction'; -- Default fallback
  END IF;

  v_actual_cost := p_cost;
  
  -- 3. Calculator New Balance
  IF v_action_type = 'addition' THEN
     v_new_balance := v_current_balance + v_actual_cost;
     v_trx_type := 'bonus'; -- 'bonus' fits for earned credits
  ELSE
     -- Deduction
     IF v_current_balance < v_actual_cost THEN
       RAISE EXCEPTION 'Insufficient credits';
     END IF;
     v_new_balance := v_current_balance - v_actual_cost;
     v_trx_type := 'usage';
  END IF;

  -- 4. Update Wallet
  UPDATE public.credit_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  -- 5. Log Transaction
  -- For additions, we record positive amount? 
  -- Usually credit_transactions.amount is signed. 
  -- Existing usage logic: values (v_wallet_id, -p_cost, ...)
  -- So if addition, we want +p_cost.
  
  INSERT INTO public.credit_transactions (
    wallet_id, 
    amount, 
    type, 
    description, 
    reference_id,
    metadata
  ) VALUES (
    v_wallet_id, 
    CASE WHEN v_action_type = 'addition' THEN v_actual_cost ELSE -v_actual_cost END,
    v_trx_type, 
    'Action: ' || v_action_name, 
    p_ref_id,
    jsonb_build_object('action_key', p_action_key, 'action_type', v_action_type)
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. New RPC: Admin Adjust Credits
CREATE OR REPLACE FUNCTION admin_adjust_credits(
  p_user_id uuid,
  p_amount int,
  p_description text
) RETURNS int AS $$
DECLARE
  v_wallet_id uuid;
  v_current_balance int;
  v_new_balance int;
BEGIN
  -- Check if admin (simple check, rely on RLS/API layer for real security or add clause here)
  -- For now disabling this check inside DB to rely on Service Role key usage from Server Action
  
  -- 1. Lock Wallet
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  -- 2. Calculate
  v_new_balance := v_current_balance + p_amount;

  -- Prevent negative balance?
  IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Balance cannot fall below zero';
  END IF;

  -- 3. Update
  UPDATE public.credit_wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  -- 4. Log
  INSERT INTO public.credit_transactions (
    wallet_id, 
    amount, 
    type, 
    description, 
    metadata
  ) VALUES (
    v_wallet_id, 
    p_amount, 
    'admin_adjustment', 
    p_description, 
    jsonb_build_object('admin_adjustment', true)
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
