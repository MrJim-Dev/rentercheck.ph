"use server"

import { IncidentApprovedEmail } from "@/components/emails/incident-approved"
import { IncidentRejectedEmail } from "@/components/emails/incident-rejected"
import { IncidentUnderReviewEmail } from "@/components/emails/incident-under-review"
import type { Database, Enums } from "@/lib/database.types"
import { sendEmail } from "@/lib/email"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
}): Promise<ActionResult<{ reports: (Database["public"]["Tables"]["incident_reports"]["Row"] & { report_group_members: { group_id: string }[] | { group_id: string } | null | any })[]; total: number }>> {
    try {
        const supabase = await createClient()

        // Update query to fetch group details
        let query = supabase
            .from("incident_reports")
            .select(`
                *,
                report_group_members (
                    group_id,
                    report_groups (
                        id,
                        primary_report_id,
                        report_group_members (id)
                    )
                )
            `, { count: "exact" })
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

        // Handle pagination - fetch extra to allow for filtering
        const limit = options?.limit || 50
        const offset = options?.offset || 0

        // We fetch 3x the limit to have a buffer for filtered items
        // This is a trade-off: true DB filtering is complex without Views/RPC
        query = query.range(offset, offset + (limit * 3) - 1)

        const { data, error, count } = await query

        if (error) {
            console.error("Error fetching all reports:", error)
            return { success: false, error: "Failed to fetch reports" }
        }

        // Filter out secondary reports
        let filteredReports = (data || []).filter((report: any) => {
            const members = report.report_group_members
            if (!members) return true

            const memberList = Array.isArray(members) ? members : [members]
            if (memberList.length === 0) return true

            const groupInfo = memberList[0]?.report_groups
            if (!groupInfo) return true

            // Should be visible if it is the primary report
            return groupInfo.primary_report_id === report.id
        })

        // Slice to actual limit
        filteredReports = filteredReports.slice(0, limit)

        // Process reports to attach easy-to-use group metadata
        const processedReports = filteredReports.map((report: any) => {
            const members = report.report_group_members
            const memberList = Array.isArray(members) ? members : (members ? [members] : [])

            if (memberList.length > 0 && memberList[0].report_groups) {
                const group = memberList[0].report_groups
                // The count comes from the nested report_group_members inside report_groups
                const memberCount = group.report_group_members?.length || 0

                return {
                    ...report,
                    is_group_primary: true,
                    group_id: group.id,
                    group_member_count: memberCount
                }
            }

            return report
        })

        return { success: true, data: { reports: processedReports as any, total: count || 0 } }
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
    groupReports?: {
        report: Database["public"]["Tables"]["incident_reports"]["Row"]
        evidence: Database["public"]["Tables"]["report_evidence"]["Row"][]
    }[]
}>> {
    try {
        const supabase = await createClient()

        // 1. Get the main report properly
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select(`
                *,
                report_group_members (
                    group_id
                )
            `)
            .eq("id", reportId)
            .single()

        if (reportError || !report) {
            console.error("Error fetching report details:", reportError)
            return { success: false, error: "Report not found" }
        }

        const [evidenceResult, identifiersResult] = await Promise.all([
            supabase.from("report_evidence").select("*").eq("report_id", reportId).order("display_order"),
            supabase.from("report_identifiers").select("*").eq("report_id", reportId),
        ])

        // 2. Check if it's in a group
        const groups = report.report_group_members
        const groupId = Array.isArray(groups) ? groups[0]?.group_id : (groups as any)?.group_id

        let groupReportsData: any[] = []

        if (groupId) {
            // Fetch all reports in the group
            const { data: groupMembers, error: groupError } = await supabase
                .from("report_group_members")
                .select(`
                    incident_reports (
                        *
                    )
                `)
                .eq("group_id", groupId)
                // Order by date to show history chronologically
                .order("added_at", { ascending: true })

            if (!groupError && groupMembers) {
                // For each member, we need their evidence. 
                const memberReports = groupMembers
                    .map(m => m.incident_reports)
                    .filter(Boolean) as any[]

                // Fetch evidence for all these reports
                const { data: allEvidence } = await supabase
                    .from("report_evidence")
                    .select("*")
                    .in("report_id", memberReports.map(r => r.id))

                // Combine them
                groupReportsData = memberReports.map(r => ({
                    report: r,
                    evidence: allEvidence?.filter(e => e.report_id === r.id) || []
                }))
            }
        }

        return {
            success: true,
            data: {
                report,
                evidence: evidenceResult.data || [],
                identifiers: identifiersResult.data || [],
                groupReports: groupReportsData.length > 0 ? groupReportsData : undefined
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

        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select("status, reporter_email, reported_full_name")
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

        // Send Email if Approved
        // Send Email if Approved
        if (newStatus === 'APPROVED' && report.reporter_email) {
            await sendEmail({
                to: report.reporter_email,
                subject: 'Your Incident Report has been Approved',
                react: IncidentApprovedEmail({
                    reportedName: report.reported_full_name,
                    reportId: reportId
                })
            })
        } else if (newStatus === 'REJECTED' && report.reporter_email) {
            await sendEmail({
                to: report.reporter_email,
                subject: 'Your Incident Report has been Rejected',
                react: IncidentRejectedEmail({
                    reportedName: report.reported_full_name,
                    rejectionReason: rejectionReason
                })
            })
        } else if (newStatus === 'UNDER_REVIEW' && report.reporter_email) {
            await sendEmail({
                to: report.reporter_email,
                subject: 'Your Incident Report is Under Review',
                react: IncidentUnderReviewEmail({
                    reportedName: report.reported_full_name,
                    adminNotes: notes
                })
            })
        }

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

/**
 * Update report details with tracking
 */
export async function updateReportDetails(
    reportId: string,
    updates: Partial<Database["public"]["Tables"]["incident_reports"]["Update"]>,
    changeNote: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        // Check admin status
        const adminCheck = await checkIsAdmin()
        if (!adminCheck.success || !adminCheck.data?.isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        // Get current report state
        const { data: currentReport, error: fetchError } = await supabase
            .from("incident_reports")
            .select("*")
            .eq("id", reportId)
            .single()

        if (fetchError || !currentReport) {
            return { success: false, error: "Report not found" }
        }

        // Track changes
        const changes: Record<string, { old: any; new: any }> = {}
        Object.entries(updates).forEach(([key, newValue]) => {
            const oldValue = currentReport[key as keyof typeof currentReport]
            if (oldValue !== newValue) {
                changes[key] = { old: oldValue, new: newValue }
            }
        })

        if (Object.keys(changes).length === 0) {
            return { success: false, error: "No changes detected" }
        }

        // Update the report
        const { error: updateError } = await supabase
            .from("incident_reports")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", reportId)

        if (updateError) {
            console.error("Error updating report:", updateError)
            return { success: false, error: "Failed to update report" }
        }

        // Log the edit in report_edits table
        const { error: logError } = await supabase
            .from("report_edits")
            .insert({
                report_id: reportId,
                edited_by: user.id,
                changes: changes,
                change_note: changeNote,
            })

        if (logError) {
            console.error("Error logging report edit:", logError)
            // Don't fail the whole operation if logging fails
        }

        // Also log in admin actions
        await supabase.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: user.id,
            action_type: "REPORT_EDITED",
            notes: changeNote,
        })

        revalidatePath("/admin")
        revalidatePath("/my-reports")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in updateReportDetails:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get report edit history
 */
export async function getReportEditHistory(reportId: string): Promise<ActionResult<Array<{
    id: string
    edited_at: string
    edited_by_email: string | null
    changes: Record<string, { old: any; new: any }>
    change_note: string
    type: 'EDIT' | 'ACTION'
}>>> {
    try {
        const supabase = await createClient()

        // Check admin status
        const adminCheck = await checkIsAdmin()
        if (!adminCheck.success || !adminCheck.data?.isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        const adminClient = await createAdminClient() // Bypass RLS for actions history
        const [editsResult, actionsResult] = await Promise.all([
            // Edits might need regular client or admin client? 
            // Regular client is fine for edits if policy allows, but let's stick to regular for now unless issues.
            supabase
                .from("report_edits")
                .select(`
                    id,
                    edited_at,
                    change_note,
                    changes,
                    edited_by_email:admin_users!report_edits_edited_by_fkey(email)
                `)
                .eq("report_id", reportId)
                .order("edited_at", { ascending: false }),
            adminClient
                .from("report_admin_actions")
                .select(`
                    id,
                    created_at,
                    action_type,
                    notes,
                    admin_id,
                    admin_users (
                        email
                    )
                `)
                .eq("report_id", reportId)
                .in("action_type", ["MERGED", "UNMERGED", "GROUP_DISSOLVED", "STATUS_CHANGE", "TRANSFERRED", "NOTE_ADDED"])
                .order("created_at", { ascending: false })
        ])

        if (editsResult.error) {
            console.error("Error fetching edit history:", editsResult.error)
            return { success: false, error: "Failed to fetch edit history" }
        }

        if (actionsResult.error) {
            console.error("Error fetching action history:", actionsResult.error)
            // We don't return failure here, just log it and show edits only?
            // Or we should potentially fail? If we want to debug, failing might be better visibility if toast shows error.
            // But for UX, showing edits is better than nothing.
            // I will log it heavily.
        }

        const edits = (editsResult.data || []).map((item: any) => ({
            id: item.id,
            edited_at: item.edited_at,
            edited_by_email: (item.edited_by_email as any)?.email || null,
            changes: item.changes as Record<string, { old: any; new: any }>,
            change_note: item.change_note || "",
            type: 'EDIT' as const
        }))

        const actions = (actionsResult.data || []).map((item: any) => ({
            id: item.id,
            edited_at: item.created_at,
            edited_by_email: (item.admin_users as any)?.email || "System",
            changes: {
                "Action": {
                    old: null,
                    new: item.action_type === "MERGED" ? "Merged Reports" :
                        item.action_type === "UNMERGED" ? "Unmerged Report" :
                            item.action_type === "GROUP_DISSOLVED" ? "Group Dissolved" :
                                item.action_type
                }
            } as Record<string, { old: any; new: any }>,
            change_note: item.notes || "",
            type: 'ACTION' as const
        }))

        // Combine and sort by date descending
        const formattedData = [...edits, ...actions].sort((a, b) =>
            new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime()
        )

        return { success: true, data: formattedData }
    } catch (error) {
        console.error("Unexpected error in getReportEditHistory:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Transfer report ownership to another user
 */
export async function transferReport(reportId: string, newUserId: string, reason?: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Check admin status
        const adminCheck = await checkIsAdmin()
        if (!adminCheck.success || !adminCheck.data?.isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: "User not authenticated" }
        }

        // Verify the report exists
        const { data: report } = await supabase
            .from("incident_reports")
            .select("reporter_id")
            .eq("id", reportId)
            .single()

        if (!report) {
            return { success: false, error: "Report not found" }
        }

        // Verify the new user exists
        const { data: newUser } = await supabase
            .from("users")
            .select("id, email, full_name")
            .eq("id", newUserId)
            .single()

        if (!newUser) {
            return { success: false, error: "Target user not found" }
        }

        // Update the report's reporter_id
        const { error: updateError } = await supabase
            .from("incident_reports")
            .update({ reporter_id: newUserId })
            .eq("id", reportId)

        if (updateError) {
            console.error("Error transferring report:", updateError)
            return { success: false, error: "Failed to transfer report" }
        }

        // Log the transfer action
        await supabase.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: user.id,
            action_type: "TRANSFERRED",
            notes: reason || `Report transferred to user ${newUser.full_name || newUser.email} (${newUserId})`,
        })

        revalidatePath("/admin")
        revalidatePath("/my-reports")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in transferReport:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get all users for transfer dropdown
 */
export async function getAllUsers(search?: string, excludeUserId?: string): Promise<ActionResult<Array<{ id: string; email: string; full_name: string | null }>>> {
    try {
        const supabase = await createClient()

        // Check admin status
        const adminCheck = await checkIsAdmin()
        if (!adminCheck.success || !adminCheck.data?.isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        let query = supabase
            .from("users")
            .select("id, email, full_name")
            .order("full_name", { ascending: true })

        if (search && search.trim()) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        }

        // Exclude a specific user (e.g., current reporter)
        if (excludeUserId) {
            query = query.neq("id", excludeUserId)
        }

        const { data, error } = await query.limit(50)

        if (error) {
            console.error("Error fetching users:", error)
            return { success: false, error: "Failed to fetch users" }
        }

        return { success: true, data: data || [] }
    } catch (error) {
        console.error("Unexpected error in getAllUsers:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Hard delete a report and all its related data
 * This permanently removes the report from the database
 * Use for spam or duplicate reports only
 */
export async function hardDeleteReport(reportId: string, reason?: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Check admin status
        const adminCheck = await checkIsAdmin()
        if (!adminCheck.success || !adminCheck.data?.isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: "User not authenticated" }
        }

        // Get report details before deletion for logging
        const { data: report } = await supabase
            .from("incident_reports")
            .select("*")
            .eq("id", reportId)
            .single()

        if (!report) {
            return { success: false, error: "Report not found" }
        }

        // Get all evidence storage paths for deletion
        const { data: evidence } = await supabase
            .from("report_evidence")
            .select("storage_path")
            .eq("report_id", reportId)

        // Delete evidence files from storage
        if (evidence && evidence.length > 0) {
            const filePaths = evidence.map(e => e.storage_path)
            const { error: storageError } = await supabase
                .storage
                .from("evidence")
                .remove(filePaths)

            if (storageError) {
                console.error("Error deleting evidence files:", storageError)
                // Continue with deletion even if storage removal fails
            }
        }

        // Log the deletion action before deleting the report
        await supabase.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: user.id,
            action_type: "HARD_DELETED",
            notes: reason || "Report hard deleted by admin",
        })

        // Delete related records (cascading should handle most, but being explicit)
        // These will be deleted due to foreign key constraints, but we can be explicit:
        // 1. report_evidence - CASCADE DELETE
        // 2. report_identifiers - CASCADE DELETE
        // 3. report_edits - CASCADE DELETE
        // 4. disputes - CASCADE DELETE
        // 5. Any other related tables

        // Delete the report (this will cascade to related tables)
        const { error: deleteError } = await supabase
            .from("incident_reports")
            .delete()
            .eq("id", reportId)

        if (deleteError) {
            console.error("Error deleting report:", deleteError)
            return { success: false, error: "Failed to delete report" }
        }

        revalidatePath("/admin")
        revalidatePath("/search")
        revalidatePath("/my-reports")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in hardDeleteReport:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}
