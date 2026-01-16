"use server"

import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "./admin"

export type DisputeResult<T = undefined> = {
    success: boolean
    error?: string
    data?: T
}

export interface AdminDispute {
    id: string
    report_id: string
    disputer_id: string
    category: string
    reason: string
    status: 'OPEN' | 'APPROVED' | 'REJECTED'
    created_at: string
    evidence: Array<{
        id: string
        file_name: string
        mime_type: string
        storage_path: string
    }>
    report: {
        id: string
        reported_full_name: string
        incident_type: string
    } | null
    disputer: {
        email: string
    } | null
}

export async function getAdminDisputes(): Promise<DisputeResult<AdminDispute[]>> {
    // Check admin
    const adminCheck = await checkIsAdmin()
    if (!adminCheck.success || !adminCheck.data?.isAdmin) {
        return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('incident_disputes')
        .select(`
            *,
            report:incident_reports(id, reported_full_name, incident_type),
            disputer:users(email),
            evidence:dispute_evidence(id, file_name, mime_type, storage_path)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching disputes:", error)
        return { success: false, error: "Failed to fetch disputes" }
    }

    return { success: true, data: data as AdminDispute[] }
}
