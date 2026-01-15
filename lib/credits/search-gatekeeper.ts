
import { consumeCredits } from "@/lib/actions/credits"
import type { SearchInput } from "@/lib/matching"
import { normalizeEmail, normalizeFacebookUrl, normalizeName, normalizePhone } from "@/lib/matching"
import { createClient } from "@/lib/supabase/server"
import { CreditAction, getCachedActionCost } from "./gatekeeper"

interface BillableItem {
    type: 'NAME' | 'PHONE' | 'EMAIL' | 'FACEBOOK'
    value: string
    original: string
    cost: number
    actionKey: string
}

/**
 * Calculates the total cost for a search query and gates the action.
 * Throws an error if the user has insufficient credits.
 * 
 * LEDGER SYSTEM:
 * Checks 'search_access_logs' to prevent double-billing for the same parameters
 * within a 24-hour window.
 */
export async function gateComplexSearch(
    input: SearchInput,
    userId: string
): Promise<void> {
    const supabase = await createClient()

    // 1. Identify all potential billable items from input
    const candidates: BillableItem[] = []

    // Name
    if (input.name) {
        const norm = normalizeName(input.name)
        if (norm) {
            const cost = await getCachedActionCost(CreditAction.SEARCH_NAME)
            if (cost > 0) {
                candidates.push({
                    type: 'NAME',
                    value: norm,
                    original: input.name,
                    cost,
                    actionKey: CreditAction.SEARCH_NAME
                })
            }
        }
    }

    // Phone (Primary + Additional)
    const allPhones = [input.phone, ...(input.additionalPhones || [])].filter(Boolean) as string[]
    const phoneCost = await getCachedActionCost(CreditAction.SEARCH_PHONE)
    if (phoneCost > 0) {
        for (const p of allPhones) {
            const norm = normalizePhone(p)
            if (norm) {
                candidates.push({
                    type: 'PHONE',
                    value: norm,
                    original: p,
                    cost: phoneCost,
                    actionKey: CreditAction.SEARCH_PHONE
                })
            }
        }
    }

    // Email (Primary + Additional)
    const allEmails = [input.email, ...(input.additionalEmails || [])].filter(Boolean) as string[]
    const emailCost = await getCachedActionCost(CreditAction.SEARCH_EMAIL)
    if (emailCost > 0) {
        for (const e of allEmails) {
            const norm = normalizeEmail(e)
            if (norm) {
                candidates.push({
                    type: 'EMAIL',
                    value: norm,
                    original: e,
                    cost: emailCost,
                    actionKey: CreditAction.SEARCH_EMAIL
                })
            }
        }
    }

    // Facebook (Primary + Additional)
    const allFb = [input.facebook, ...(input.additionalFacebooks || [])].filter(Boolean) as string[]
    const fbCost = await getCachedActionCost(CreditAction.SEARCH_FACEBOOK)
    if (fbCost > 0) {
        for (const f of allFb) {
            const norm = normalizeFacebookUrl(f)
            if (norm) {
                candidates.push({
                    type: 'FACEBOOK',
                    value: norm,
                    original: f,
                    cost: fbCost,
                    actionKey: CreditAction.SEARCH_FACEBOOK
                })
            }
        }
    }

    // If nothing to bill, return early
    if (candidates.length === 0) return

    // 2. CHECK LEDGER: Filter out items already paid for
    // We fetch active logs for this user matching our candidate types/values
    const { data: logs } = await supabase
        .from('search_access_logs')
        .select('parameter_type, parameter_value')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .in('parameter_type', candidates.map(c => c.type))
    // We can't easily .in('parameter_value') because values might overlap across types (rare but possible)
    // So we'll fetch all active logs for these types (or we could optimize if list is huge, but typical search is small)
    // A better query would be OR conditions, but supabase JS syntax for complex OR on (type, value) tuples is tricky.
    // Given search history per day is small, fetching valid logs for these TYPES is ok.

    const paidSet = new Set<string>()
    if (logs) {
        for (const log of logs) {
            paidSet.add(`${log.parameter_type}:${log.parameter_value}`)
        }
    }

    const itemsToBill = candidates.filter(item => !paidSet.has(`${item.type}:${item.value}`))

    // 3. Calculate Final Cost
    const totalCost = itemsToBill.reduce((sum, item) => sum + item.cost, 0)

    // 4. Gate / Deduct
    if (totalCost > 0) {
        // Create a summary description
        // Group by type for cleaner display "Name(1), Phone x2(4)"
        const summary = Object.entries(itemsToBill.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1
            return acc
        }, {} as Record<string, number>))
            .map(([type, count]) => `${type} x${count}`)
            .join(', ')

        const description = `Search: ${summary}`

        await consumeCredits(description, undefined, totalCost)
    }

    // 5. UPDATE LEDGER (Write new items)
    if (itemsToBill.length > 0) {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

        const { error } = await supabase.from('search_access_logs').insert(
            itemsToBill.map(item => ({
                user_id: userId,
                parameter_type: item.type,
                parameter_value: item.value,
                expires_at: expiresAt.toISOString()
            }))
        )

        if (error) {
            // Non-blocking error logging
            console.error("Failed to update search ledger:", error)
        }
    }
}
