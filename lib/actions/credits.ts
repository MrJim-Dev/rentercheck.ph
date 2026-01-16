'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Fetch the current user's credit balance.
 * Returns 0 if no user or no wallet found.
 */
export async function getCreditsBalance() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
        .from('credit_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()

    if (error) {
        // It's possible the wallet doesn't exist yet if the trigger failed or old user
        // We suppress error and return 0
        return 0
    }

    return data.balance
}

/**
 * Deduct credits from the user's wallet.
 * @param amount Number of credits to consume (default 1)
 * @param description Reason for consumption (e.g. "Run Tenant Check")
 * @param referenceId Optional reference (e.g. Report ID)
 */
export async function consumeCredits(
    description: string,
    referenceId?: string,
    amount: number = 1
) {
    const supabase = await createClient()

    // Call the atomic RPC function
    const { data: newBalance, error } = await supabase.rpc('consume_credits', {
        p_amount: amount,
        p_description: description,
        p_reference_id: referenceId,
        p_type: 'usage'
    })

    if (error) {
        if (error.message.includes('Insufficient credits')) {
            throw new Error('Insufficient credits')
        }
        throw new Error(`Transaction failed: ${error.message}`)
    }

    revalidatePath('/', 'layout') // Update UI where balance is shown (Header)
    return newBalance
}

/**
 * BETA: Free refill for testing.
 * Requires 'refill_credits' RPC to be created in DB.
 */
export async function betaRefillCredits() {
    const supabase = await createClient()

    // We reuse the database logic for safety
    // If we haven't created a 'refill_credits' RPC yet, we can't do this securely from client
    // But for now, we will try to call an RPC we expect to exist, or fail.
    // actually, let's assume we will add the RPC.

    const { data: newBalance, error } = await supabase.rpc('refill_credits', {
        p_amount: 10,
        p_description: 'Beta Tester Refill'
    })

    if (error) {
        throw new Error(`Refill failed: ${error.message}`)
    }

    revalidatePath('/app/my-reports')
    return newBalance
}
