"use server"

import { createClient } from "@/lib/supabase/server"

export interface SearchHistoryEntry {
    id: string
    query: string
    parameterTypes: string[]
    creditsCost: number
    searchedAt: string
    expiresAt: string
    isActive: boolean
}

export interface SearchHistoryResult {
    success: boolean
    history?: SearchHistoryEntry[]
    error?: string
}

/**
 * Get the search history for the current user.
 * Reconstructs search sessions from search_access_logs grouped by created_at proximity.
 */
export async function getSearchHistory(limit = 50): Promise<SearchHistoryResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        // Fetch recent search access logs for this user
        const { data: logs, error: logsError } = await supabase
            .from("search_access_logs")
            .select("id, parameter_type, parameter_value, expires_at, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit * 4) // Fetch more to group into sessions

        if (logsError) {
            return { success: false, error: logsError.message }
        }

        if (!logs || logs.length === 0) {
            return { success: true, history: [] }
        }

        // Group logs into search sessions (logs within 5 seconds of each other = same search)
        const sessions: SearchHistoryEntry[] = []
        let currentSession: typeof logs = []
        let sessionStartTime: Date | null = null

        for (const log of logs) {
            const logTime = new Date(log.created_at)

            if (!sessionStartTime || (sessionStartTime.getTime() - logTime.getTime()) > 5000) {
                // New session
                if (currentSession.length > 0) {
                    sessions.push(buildSessionEntry(currentSession))
                }
                currentSession = [log]
                sessionStartTime = logTime
            } else {
                currentSession.push(log)
            }
        }

        // Don't forget the last session
        if (currentSession.length > 0) {
            sessions.push(buildSessionEntry(currentSession))
        }

        return { success: true, history: sessions.slice(0, limit) }
    } catch (error) {
        console.error("Error fetching search history:", error)
        return { success: false, error: "Failed to fetch search history" }
    }
}

function buildSessionEntry(logs: Array<{
    id: string
    parameter_type: string
    parameter_value: string
    expires_at: string
    created_at: string
}>): SearchHistoryEntry {
    const parameterTypes = [...new Set(logs.map(l => l.parameter_type))]
    const now = new Date()
    const expiresAt = logs[0].expires_at
    const isActive = new Date(expiresAt) > now

    // Build a human-readable query string from the parameter values
    const nameParts = logs.filter(l => l.parameter_type === "NAME").map(l => l.parameter_value)
    const phoneParts = logs.filter(l => l.parameter_type === "PHONE").map(l => l.parameter_value)
    const emailParts = logs.filter(l => l.parameter_type === "EMAIL").map(l => l.parameter_value)
    const fbParts = logs.filter(l => l.parameter_type === "FACEBOOK").map(l => l.parameter_value)

    const queryParts: string[] = [
        ...nameParts,
        ...phoneParts,
        ...emailParts,
        ...fbParts.map(fb => {
            // Shorten Facebook URLs for display
            const match = fb.match(/facebook\.com\/([^/?]+)/)
            return match ? `fb:${match[1]}` : fb
        }),
    ]

    return {
        id: logs[0].id,
        query: queryParts.join(", ") || "Unknown query",
        parameterTypes,
        creditsCost: logs.length, // Each log entry = 1 credit
        searchedAt: logs[0].created_at,
        expiresAt,
        isActive,
    }
}

/**
 * Get search statistics for the current user.
 */
export async function getSearchStats(): Promise<{
    success: boolean
    stats?: {
        totalSearches: number
        creditsUsedThisMonth: number
        activeSearches: number
        mostSearchedType: string | null
    }
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        // Get all logs this month
        const { data: monthLogs } = await supabase
            .from("search_access_logs")
            .select("parameter_type, expires_at, created_at")
            .eq("user_id", user.id)
            .gte("created_at", startOfMonth)

        if (!monthLogs) {
            return { success: true, stats: { totalSearches: 0, creditsUsedThisMonth: 0, activeSearches: 0, mostSearchedType: null } }
        }

        const activeSearches = monthLogs.filter(l => new Date(l.expires_at) > now).length
        const creditsUsedThisMonth = monthLogs.length

        // Count by type
        const typeCounts = monthLogs.reduce((acc, l) => {
            acc[l.parameter_type] = (acc[l.parameter_type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const mostSearchedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

        // Estimate total unique searches (group by 5-second windows)
        const totalSearches = Math.ceil(monthLogs.length / 1.5) // Rough estimate

        return {
            success: true,
            stats: {
                totalSearches,
                creditsUsedThisMonth,
                activeSearches,
                mostSearchedType,
            }
        }
    } catch (error) {
        console.error("Error fetching search stats:", error)
        return { success: false, error: "Failed to fetch search stats" }
    }
}
