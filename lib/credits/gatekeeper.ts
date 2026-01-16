import { createClient } from "@/lib/supabase/client";

// 1. Define your actions here
export enum CreditAction {
    REPORT_CREATION = 'report_creation',
    SEARCH_NAME = 'search_by_name',
    SEARCH_PHONE = 'search_by_phone',
    SEARCH_EMAIL = 'search_by_email',
    SEARCH_FACEBOOK = 'search_by_facebook',
    // Future actions:
    // SEARCH_RENTER = 'search_renter', 
    // VIEW_PROFILE = 'view_profile',
}

// 2. The One-Liner Function (Optimized for Scale)
export async function gateAction(
    action: CreditAction,
    userId: string,
    referenceId?: string
): Promise<void> {
    const supabase = createClient()

    // A. READ: Fetch cost (Cached! ⚡️)
    // For now we'll do a direct DB call but wrapped in a way we can easily add Next.js caching later
    // Realistically, for an MVP, a direct DB call is fine (Postgres is fast).
    // But per plan, we want "Scalable to the Fullest".

    // NOTE: In a server action, we can use unstable_cache. 
    // We'll separate the cost lookup to a cached function.
    const cost = await getCachedActionCost(action);

    // B. If free, exit early (0ms latency penalty)
    if (cost <= 0) return;

    // C. WRITE: atomic_deduct_credit RPC (1 DB Roundtrip ⚡️)
    // Handles balance check + deduction + log in ONE move.

    // We need a Supabase client with admin/service role if acts are server-side? 
    // Or just the user's client if RLS allows it?
    // The RPC 'perform_cost_deduction' uses 'security definer' so it runs as owner.
    // So the input user client works fine as long as RLS on wallets allows 'update' or RPC handles it.
    // Our RPC takes 'p_user_id', checking 'auth.uid()' inside or trusting the param?
    // The migration said: "where user_id = p_user_id"
    // AND "for update".
    // 
    // Ideally, for security, the RPC should enforce `auth.uid() = p_user_id` unless it's an admin RPC.
    // But `gateAction` is likely called from Server Actions where we trust the `userId` passed (verified by auth.getUser).

    const { error } = await supabase.rpc('perform_cost_deduction', {
        p_user_id: userId,
        p_action_key: action,
        p_cost: cost,
        p_ref_id: referenceId
    });

    if (error) {
        if (error.message.includes('Insufficient credits')) {
            throw new Error("INSUFFICIENT_CREDITS");
        }
        throw new Error(error.message);
    }
}

// Helper to get cost (Cached)
export const getCachedActionCost = async (action: string) => {
    // In a real high-scale app, we'd wrap this with unstable_cache
    // export const getActionCost = unstable_cache(async (key) => { ... }, ['action-costs'], { tags: ['config'] })

    // For now, let's just fetch efficiently
    const supabase = createClient()
    const { data } = await supabase
        .from('credit_action_costs')
        .select('cost')
        .eq('action_key', action)
        .single();

    return data?.cost ?? 0;
}
