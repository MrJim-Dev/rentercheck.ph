import type { AuthIdentity } from "@/lib/auth/types"
import { withRequestContext } from "@/lib/db/pool"

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string | null
    updated_at: string | null
}

/**
 * Mirrors a signed shared-auth identity into the application profile table.
 * The auth subject is inserted as-is; this function never generates or maps
 * a replacement UUID.
 */
export async function ensureUserProfile(identity: AuthIdentity): Promise<UserProfile> {
    if (!identity.email) {
        throw new Error("Shared-auth identity does not contain an email address")
    }

    return withRequestContext({ userId: identity.id, role: "authenticated" }, async (client) => {
        const authUser = await client.query<{ migrated: boolean }>(
            `
            SELECT COALESCE((app_metadata->'migration'->>'source') = 'supabase', false) AS migrated
            FROM auth.users
            WHERE id = $1::uuid
            `,
            [identity.id],
        )
        const migratedAccount = authUser.rows[0]?.migrated ?? false
        const walletBalance = migratedAccount ? 0 : 50

        const result = await client.query<UserProfile>(
            `
            INSERT INTO public.users (id, email, full_name, avatar_url)
            VALUES ($1::uuid, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
                avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
                updated_at = now()
            RETURNING id, email, full_name, avatar_url, created_at, updated_at
            `,
            [identity.id, identity.email, identity.displayName, identity.avatarUrl],
        )

        const profile = result.rows[0]
        if (!profile) throw new Error("User profile was not returned after synchronization")

        const wallet = await client.query<{ id: string }>(
            `
            INSERT INTO public.credit_wallets (user_id, balance)
            VALUES ($1::uuid, $2)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING id
            `,
            [identity.id, walletBalance],
        )

        if (wallet.rows[0] && !migratedAccount) {
            await client.query(
                `
                INSERT INTO public.credit_transactions (wallet_id, amount, type, description)
                VALUES ($1::uuid, 50, 'bonus', 'Welcome Bonus: 50 Free Credits')
                `,
                [wallet.rows[0].id],
            )
        }

        return profile
    })
}
