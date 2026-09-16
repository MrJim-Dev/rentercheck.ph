-- RenterCheck target runtime hardening for MrJim Auth-backed writes.
-- Run as the database owner after the canonical schema is restored.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
          AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
            ON public.users
            FOR INSERT
            WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'credit_wallets'
          AND policyname = 'Users can create own starter wallet'
    ) THEN
        CREATE POLICY "Users can create own starter wallet"
            ON public.credit_wallets
            FOR INSERT
            WITH CHECK (
                auth.uid() = user_id
                AND balance IN (0, 50)
                AND currency = 'PHP'
            );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'credit_transactions'
          AND policyname = 'Users can record starter bonus'
    ) THEN
        CREATE POLICY "Users can record starter bonus"
            ON public.credit_transactions
            FOR INSERT
            WITH CHECK (
                amount = 50
                AND type = 'bonus'
                AND description = 'Welcome Bonus: 50 Free Credits'
                AND EXISTS (
                    SELECT 1
                    FROM public.credit_wallets wallet
                    WHERE wallet.id = wallet_id
                      AND wallet.user_id = auth.uid()
                )
            );
    END IF;
END
$$;
