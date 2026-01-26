"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CreditActionConfig {
    action_key: string
    action_name: string
    cost: number
    action_type: 'deduction' | 'addition'
    is_active: boolean
    description: string | null
    updated_at: string
}

export async function getCreditConfigs() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('credit_action_costs')
        .select('*')
        .order('action_name')

    if (error) {
        console.error('Error fetching credit configs:', error)
        return { success: false, error: 'Failed to fetch configurations' }
    }

    // Default to 'deduction' if null (backward compatibility)
    const formattedData = (data as any[]).map(d => ({
        ...d,
        action_type: d.action_type || 'deduction'
    }))

    return { success: true, data: formattedData as CreditActionConfig[] }
}

export async function updateActionCost(key: string, cost: number, type?: 'deduction' | 'addition') {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // In real app: check for super_admin role
    // const isAdmin = await checkIsSuperAdmin(user.id)
    // if (!isAdmin) return { success: false, error: 'Forbidden' }

    const updates: any = {
        cost,
        updated_at: new Date().toISOString()
    }

    if (type) {
        updates.action_type = type
    }

    const { error } = await supabase
        .from('credit_action_costs')
        .update(updates)
        .eq('action_key', key)

    if (error) {
        console.error('Error updating cost:', error)
        return { success: false, error: 'Failed to update cost' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function toggleActionStatus(key: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('credit_action_costs')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('action_key', key)

    if (error) {
        console.error('Error toggling status:', error)
        return { success: false, error: 'Failed to update status' }
    }

    revalidatePath('/admin')
    return { success: true }
}
