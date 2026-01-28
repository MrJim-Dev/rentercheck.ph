"use server"

import { createClient } from "@/lib/supabase/server"

export interface AdminUser {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    balance: number
}

export interface UserTransaction {
    id: string
    amount: number
    type: string
    description: string | null
    reference_id: string | null
    created_at: string
}

/**
 * Fetch all users with their credit balances for admin view.
 */
export async function getAdminUsersList(search?: string) {
    const supabase = await createClient()

    // First get users
    let query = supabase
        .from('users')
        .select('id, email, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false })

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await query.limit(100)

    if (usersError) {
        console.error('Error fetching users:', usersError)
        return { success: false, error: 'Failed to fetch users' }
    }

    // Now get wallets for these users
    const userIds = users?.map(u => u.id) || []
    const { data: wallets, error: walletsError } = await supabase
        .from('credit_wallets')
        .select('user_id, balance')
        .in('user_id', userIds)

    if (walletsError) {
        console.error('Error fetching wallets:', walletsError)
    }

    // Merge data
    const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance]) || [])

    const result: AdminUser[] = (users || []).map(u => ({
        ...u,
        balance: walletMap.get(u.id) ?? 0
    }))

    return { success: true, data: result }
}

/**
 * Fetch transaction history for a specific user.
 */
export async function getUserTransactionHistory(userId: string) {
    const supabase = await createClient()

    // First get the wallet id
    const { data: wallet, error: walletError } = await supabase
        .from('credit_wallets')
        .select('id')
        .eq('user_id', userId)
        .single()

    if (walletError || !wallet) {
        console.error('Error fetching wallet:', walletError)
        return { success: false, error: 'User wallet not found' }
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, description, reference_id, created_at')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50)

    if (txError) {
        console.error('Error fetching transactions:', txError)
        return { success: false, error: 'Failed to fetch transactions' }
    }

    return { success: true, data: transactions as UserTransaction[] }
}

/**
 * Manually adjust a user's credit balance.
 */
export async function adjustUserCredits(userId: string, amount: number, reason: string) {
    const supabase = await createClient()

    // 1. Verify admin (In real app, check role)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // 2. Call the RPC
    const { data: newBalance, error } = await supabase.rpc('admin_adjust_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_description: reason || 'Admin Adjustment'
    })

    if (error) {
        console.error('Error adjusting credits:', error)
        return { success: false, error: error.message || 'Failed to adjust credits' }
    }

    return { success: true, newBalance }
}
