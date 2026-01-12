"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, Enums } from "@/lib/database.types"

// Response types
interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Check if current user is an admin
 */
export async function checkIsAdmin(): Promise<ActionResult<{ isAdmin: boolean; role: string | null }>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: true, data: { isAdmin: false, role: null } }
        }

        const { data: adminUser } = await supabase
            .from("admin_users")
            .select("role, is_active")
            .eq("id", user.id)
            .single()

        if (!adminUser || !adminUser.is_active) {
            return { success: true, data: { isAdmin: false, role: null } }
        }

        return { success: true, data: { isAdmin: true, role: adminUser.role } }
    } catch (error) {
        console.error("Error checking admin status:", error)
        return { success: false, error: "Failed to check admin status" }
    }
}

/**
 * Get admin dashboard stats
 */
export async function getAdminStats(): Promise<ActionResult<{
    pending_count: number
    under_review_count: number
    approved_count: number
    rejected_count: number
    reports_last_24h: number
    reports_last_7d: number
    unique_reporters: number
    verified_renters: number
}>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("admin_stats")
            .select("*")
            .single()

        if (error) {
            console.error("Error fetching admin stats:", error)
            return { success: false, error: "Failed to fetch stats" }
        }

        return { 
            success: true, 
            data: {
                pending_count: data?.pending_count || 0,
                under_review_count: data?.under_review_count || 0,
                approved_count: data?.approved_count || 0,
                rejected_count: data?.rejected_count || 0,
                reports_last_24h: data?.reports_last_24h || 0,
                reports_last_7d: data?.reports_last_7d || 0,
                unique_reporters: data?.unique_reporters || 0,
                verified_renters: data?.verified_renters || 0,
            }
        }
    } catch (error) {
        console.error("Unexpected error in getAdminStats:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get pending reports for admin review
 */
export async function getPendingReports(options?: {
    status?: Enums<"report_status">[]
    limit?: number
    offset?: number
}): Promise<ActionResult<Database["public"]["Tables"]["incident_reports"]["Row"][]>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from("incident_reports")
            .select("*")
            .order("created_at", { ascending: true })

        if (options?.status && options.status.length > 0) {
            query = query.in("status", options.status)
        } else {
            query = query.in("status", ["PENDING", "UNDER_REVIEW"])
        }

        if (options?.limit) {
            query = query.limit(options.limit)
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching pending reports:", error)
            return { success: false, error: "Failed to fetch reports" }
        }

        return { success: true, data: data || [] }
    } catch (error) {
        console.error("Unexpected error in getPendingReports:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get all reports with optional filters
 */
export async function getAllReports(options?: {
    status?: Enums<"report_status">
    incidentType?: Enums<"incident_type">
    limit?: number
    offset?: number
    search?: string
}): Promise<ActionResult<{ reports: Database["public"]["Tables"]["incident_reports"]["Row"][]; total: number }>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from("incident_reports")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })

        if (options?.status) {
            query = query.eq("status", options.status)
        }

        if (options?.incidentType) {
            query = query.eq("incident_type", options.incidentType)
        }

        if (options?.search) {
            query = query.or(`reported_full_name.ilike.%${options.search}%,reported_phone.ilike.%${options.search}%,reported_email.ilike.%${options.search}%`)
        }

        if (options?.limit) {
            query = query.limit(options.limit)
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
        }

        const { data, error, count } = await query

        if (error) {
            console.error("Error fetching all reports:", error)
            return { success: false, error: "Failed to fetch reports" }
        }

        return { success: true, data: { reports: data || [], total: count || 0 } }
    } catch (error) {
        console.error("Unexpected error in getAllReports:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get a single report with evidence
 */
export async function getReportDetails(reportId: string): Promise<ActionResult<{
    report: Database["public"]["Tables"]["incident_reports"]["Row"]
    evidence: Database["public"]["Tables"]["report_evidence"]["Row"][]
    identifiers: Database["public"]["Tables"]["report_identifiers"]["Row"][]
}>> {
    try {
        const supabase = await createClient()

        const [reportResult, evidenceResult, identifiersResult] = await Promise.all([
            supabase.from("incident_reports").select("*").eq("id", reportId).single(),
            supabase.from("report_evidence").select("*").eq("report_id", reportId).order("display_order"),
            supabase.from("report_identifiers").select("*").eq("report_id", reportId),
        ])

        if (reportResult.error || !reportResult.data) {
            return { success: false, error: "Report not found" }
        }

        return {
            success: true,
            data: {
                report: reportResult.data,
                evidence: evidenceResult.data || [],
                identifiers: identifiersResult.data || [],
            }
        }
    } catch (error) {
        console.error("Unexpected error in getReportDetails:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Update report status
 */
export async function updateReportStatus(
    reportId: string,
    newStatus: Enums<"report_status">,
    notes?: string,
    rejectionReason?: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        // Get the current report
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select("status")
            .eq("id", reportId)
            .single()

        if (reportError || !report) {
            return { success: false, error: "Report not found" }
        }

        const previousStatus = report.status

        // Update the report
        const updateData: Record<string, unknown> = {
            status: newStatus,
            status_changed_at: new Date().toISOString(),
            status_changed_by: user.id,
        }

        if (notes) {
            updateData.admin_notes = notes
        }

        if (rejectionReason && newStatus === "REJECTED") {
            updateData.rejection_reason = rejectionReason
        }

        const { error: updateError } = await supabase
            .from("incident_reports")
            .update(updateData)
            .eq("id", reportId)

        if (updateError) {
            console.error("Error updating report:", updateError)
            return { success: false, error: "Failed to update report" }
        }

        // Log the action
        await supabase.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: user.id,
            action_type: "STATUS_CHANGE",
            previous_status: previousStatus,
            new_status: newStatus,
            notes: notes || null,
        })

        revalidatePath("/admin")
        revalidatePath("/my-reports")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in updateReportStatus:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Add admin note to a report
 */
export async function addAdminNote(reportId: string, note: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        // Get current notes
        const { data: report } = await supabase
            .from("incident_reports")
            .select("admin_notes")
            .eq("id", reportId)
            .single()

        const timestamp = new Date().toISOString()
        const newNote = `[${timestamp}] ${note}`
        const updatedNotes = report?.admin_notes 
            ? `${report.admin_notes}\n\n${newNote}`
            : newNote

        const { error: updateError } = await supabase
            .from("incident_reports")
            .update({ admin_notes: updatedNotes })
            .eq("id", reportId)

        if (updateError) {
            return { success: false, error: "Failed to add note" }
        }

        // Log the action
        await supabase.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: user.id,
            action_type: "NOTE_ADDED",
            notes: note,
        })

        revalidatePath("/admin")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in addAdminNote:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get evidence signed URL
 */
export async function getAdminEvidenceUrl(storagePath: string): Promise<ActionResult<{ url: string }>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.storage
            .from("evidence")
            .createSignedUrl(storagePath, 3600) // 1 hour

        if (error || !data) {
            return { success: false, error: "Failed to get evidence URL" }
        }

        return { success: true, data: { url: data.signedUrl } }
    } catch (error) {
        console.error("Unexpected error in getAdminEvidenceUrl:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}
