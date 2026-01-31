"use server"

import type { Database } from "@/lib/database.types"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Response types
interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

type ReportGroup = Database["public"]["Tables"]["report_groups"]["Row"]
type ReportGroupInsert = Database["public"]["Tables"]["report_groups"]["Insert"]
type ReportGroupMember = Database["public"]["Tables"]["report_group_members"]["Row"]
type Report = Database["public"]["Tables"]["incident_reports"]["Row"]

/**
 * Check if current user is an admin
 */
async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { isAdmin: false, userId: null }
    }

    const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id, is_active")
        .eq("id", user.id)
        .single()

    return {
        isAdmin: !!adminUser?.is_active,
        userId: user.id
    }
}

/**
 * Create a new report group by merging multiple reports
 */
export async function mergeReports(
    reportIds: string[],
    primaryReportId: string,
    groupName?: string,
    notes?: string
): Promise<ActionResult<{ groupId: string }>> {
    try {
        const supabase = await createClient()
        const { isAdmin, userId } = await checkAdminAccess()

        if (!isAdmin || !userId) {
            return { success: false, error: "Admin access required" }
        }

        // Validation
        if (reportIds.length < 2) {
            return { success: false, error: "At least 2 reports are required to merge" }
        }

        if (!reportIds.includes(primaryReportId)) {
            return { success: false, error: "Primary report must be one of the selected reports" }
        }

        // Check if any reports are already in a group
        const { data: existingMembers } = await supabase
            .from("report_group_members")
            .select("report_id, group_id")
            .in("report_id", reportIds)

        if (existingMembers && existingMembers.length > 0) {
            const alreadyGrouped = existingMembers.map(m => m.report_id)
            return {
                success: false,
                error: `Some reports are already in a group: ${alreadyGrouped.join(", ")}`
            }
        }

        // Verify all reports exist and are approved
        const { data: reports, error: reportsError } = await supabase
            .from("incident_reports")
            .select("id, status, reported_full_name")
            .in("id", reportIds)

        if (reportsError || !reports || reports.length !== reportIds.length) {
            return { success: false, error: "One or more reports not found" }
        }

        const nonApproved = reports.filter(r => r.status !== "APPROVED")
        if (nonApproved.length > 0) {
            return {
                success: false,
                error: "All reports must be APPROVED before merging"
            }
        }

        // Create the group
        const groupData: ReportGroupInsert = {
            created_by: userId,
            primary_report_id: primaryReportId,
            group_name: groupName || null,
            notes: notes || null
        }

        const { data: newGroup, error: groupError } = await supabase
            .from("report_groups")
            .insert(groupData)
            .select()
            .single()

        if (groupError || !newGroup) {
            console.error("Error creating report group:", groupError)
            return { success: false, error: "Failed to create report group" }
        }

        // Add all reports to the group
        const members = reportIds.map(reportId => ({
            group_id: newGroup.id,
            report_id: reportId,
            added_by: userId
        }))

        const { error: membersError } = await supabase
            .from("report_group_members")
            .insert(members)

        if (membersError) {
            console.error("Error adding group members:", membersError)
            // Rollback: delete the group
            await supabase.from("report_groups").delete().eq("id", newGroup.id)
            return { success: false, error: "Failed to add reports to group" }
        }

        // Log the action
        // Log the action for all reports
        const logEntries = reportIds.map(id => ({
            report_id: id,
            admin_id: userId,
            action_type: "MERGED",
            notes: `Merged ${reportIds.length} reports into group: ${groupName || newGroup.id}${id === primaryReportId ? ' (Primary)' : ''}`
        }))

        // Use admin client to bypass RLS for logging
        const adminClient = await createAdminClient()
        const { error: logError } = await adminClient.from("report_admin_actions").insert(logEntries)

        if (logError) {
            console.error("Error logging merge action:", logError)
            // Don't fail the operation, but log the error
        }

        revalidatePath("/admin")
        revalidatePath("/search")

        return { success: true, data: { groupId: newGroup.id } }
    } catch (error) {
        console.error("Unexpected error in mergeReports:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Add additional reports to an existing group
 */
export async function addReportsToGroup(
    groupId: string,
    reportIds: string[]
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { isAdmin, userId } = await checkAdminAccess()

        if (!isAdmin || !userId) {
            return { success: false, error: "Admin access required" }
        }

        // Verify group exists
        const { data: group, error: groupError } = await supabase
            .from("report_groups")
            .select("id")
            .eq("id", groupId)
            .single()

        if (groupError || !group) {
            return { success: false, error: "Group not found" }
        }

        // Check if reports are already in a group
        const { data: existingMembers } = await supabase
            .from("report_group_members")
            .select("report_id")
            .in("report_id", reportIds)

        if (existingMembers && existingMembers.length > 0) {
            return { success: false, error: "Some reports are already in a group" }
        }

        // Add reports to group
        const members = reportIds.map(reportId => ({
            group_id: groupId,
            report_id: reportId,
            added_by: userId
        }))

        const { error: insertError } = await supabase
            .from("report_group_members")
            .insert(members)

        if (insertError) {
            console.error("Error adding reports to group:", insertError)
            return { success: false, error: "Failed to add reports to group" }
        }

        revalidatePath("/admin")
        revalidatePath("/search")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in addReportsToGroup:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Remove a report from a group (unmerge)
 */
export async function removeReportFromGroup(
    reportId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { isAdmin, userId } = await checkAdminAccess()

        if (!isAdmin || !userId) {
            return { success: false, error: "Admin access required" }
        }

        // Get the group this report belongs to
        const { data: member, error: memberError } = await supabase
            .from("report_group_members")
            .select("group_id, report_groups!inner(primary_report_id)")
            .eq("report_id", reportId)
            .single()

        if (memberError || !member) {
            return { success: false, error: "Report is not in any group" }
        }

        const groupId = member.group_id
        const primaryReportId = (member.report_groups as any).primary_report_id

        // Check how many reports are in the group
        const { data: groupMembers, error: countError } = await supabase
            .from("report_group_members")
            .select("report_id")
            .eq("group_id", groupId)

        if (countError || !groupMembers) {
            return { success: false, error: "Failed to check group size" }
        }

        // If this is the last report or only 2 reports remain, dissolve the group
        if (groupMembers.length <= 2) {
            return await dissolveReportGroup(groupId)
        }

        // Remove the report from the group
        const { error: deleteError } = await supabase
            .from("report_group_members")
            .delete()
            .eq("report_id", reportId)

        if (deleteError) {
            console.error("Error removing report from group:", deleteError)
            return { success: false, error: "Failed to remove report from group" }
        }

        // If this was the primary report, update to a new primary
        if (reportId === primaryReportId) {
            const newPrimaryId = groupMembers.find(m => m.report_id !== reportId)?.report_id
            if (newPrimaryId) {
                await supabase
                    .from("report_groups")
                    .update({ primary_report_id: newPrimaryId })
                    .eq("id", groupId)
            }
        }

        // Log the action
        // Log the action using admin client
        const adminClient = await createAdminClient()
        const { error: logError } = await adminClient.from("report_admin_actions").insert({
            report_id: reportId,
            admin_id: userId,
            action_type: "UNMERGED",
            notes: `Report removed from group ${groupId}`
        })

        if (logError) {
            console.error("Error logging unmerge action:", logError)
        }

        revalidatePath("/admin")
        revalidatePath("/search")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in removeReportFromGroup:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Dissolve a group entirely (unmerge all)
 */
export async function dissolveReportGroup(
    groupId: string
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { isAdmin, userId } = await checkAdminAccess()

        if (!isAdmin || !userId) {
            return { success: false, error: "Admin access required" }
        }

        // Verify group exists
        const { data: group, error: groupError } = await supabase
            .from("report_groups")
            .select("id, primary_report_id")
            .eq("id", groupId)
            .single()

        if (groupError || !group) {
            return { success: false, error: "Group not found" }
        }

        // Delete the group (cascade will remove members)
        const { error: deleteError } = await supabase
            .from("report_groups")
            .delete()
            .eq("id", groupId)

        if (deleteError) {
            console.error("Error dissolving group:", deleteError)
            return { success: false, error: "Failed to dissolve group" }
        }

        // Log the action
        if (group.primary_report_id) {
            // Log the action
            if (group.primary_report_id) {
                const adminClient = await createAdminClient()
                const { error: logError } = await adminClient.from("report_admin_actions").insert({
                    report_id: group.primary_report_id,
                    admin_id: userId,
                    action_type: "GROUP_DISSOLVED",
                    notes: `Group ${groupId} dissolved, all reports unmerged`
                })

                if (logError) {
                    console.error("Error logging dissolve action:", logError)
                }
            }
        }

        revalidatePath("/admin")
        revalidatePath("/search")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in dissolveReportGroup:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get all reports in a group
 */
export async function getReportGroup(
    groupId: string
): Promise<ActionResult<{
    group: ReportGroup
    reports: Report[]
}>> {
    try {
        const supabase = await createClient()

        // Get group details
        const { data: group, error: groupError } = await supabase
            .from("report_groups")
            .select("*")
            .eq("id", groupId)
            .single()

        if (groupError || !group) {
            return { success: false, error: "Group not found" }
        }

        // Get all reports in the group
        const { data: members, error: membersError } = await supabase
            .from("report_group_members")
            .select("report_id")
            .eq("group_id", groupId)

        if (membersError) {
            return { success: false, error: "Failed to fetch group members" }
        }

        const reportIds = members?.map(m => m.report_id) || []

        if (reportIds.length === 0) {
            return { success: true, data: { group, reports: [] } }
        }

        // Fetch full report details
        const { data: reports, error: reportsError } = await supabase
            .from("incident_reports")
            .select("*")
            .in("id", reportIds)
            .order("incident_date", { ascending: false })

        if (reportsError) {
            return { success: false, error: "Failed to fetch reports" }
        }

        return { success: true, data: { group, reports: reports || [] } }
    } catch (error) {
        console.error("Unexpected error in getReportGroup:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Update group metadata
 */
export async function updateReportGroup(
    groupId: string,
    updates: {
        groupName?: string
        primaryReportId?: string
        notes?: string
    }
): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { isAdmin, userId } = await checkAdminAccess()

        if (!isAdmin || !userId) {
            return { success: false, error: "Admin access required" }
        }

        // Build update object
        const updateData: Partial<ReportGroup> = {}
        if (updates.groupName !== undefined) updateData.group_name = updates.groupName
        if (updates.primaryReportId !== undefined) updateData.primary_report_id = updates.primaryReportId
        if (updates.notes !== undefined) updateData.notes = updates.notes

        if (Object.keys(updateData).length === 0) {
            return { success: false, error: "No updates provided" }
        }

        // If updating primary report, verify it's in the group
        if (updates.primaryReportId) {
            const { data: member } = await supabase
                .from("report_group_members")
                .select("report_id")
                .eq("group_id", groupId)
                .eq("report_id", updates.primaryReportId)
                .single()

            if (!member) {
                return { success: false, error: "Primary report must be a member of the group" }
            }
        }

        // Update the group
        const { error: updateError } = await supabase
            .from("report_groups")
            .update(updateData)
            .eq("id", groupId)

        if (updateError) {
            console.error("Error updating group:", updateError)
            return { success: false, error: "Failed to update group" }
        }

        revalidatePath("/admin")
        revalidatePath("/search")

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in updateReportGroup:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get all groups (for admin overview)
 */
export async function getAllReportGroups(): Promise<ActionResult<Array<{
    group: ReportGroup
    reportCount: number
    reports: Report[]
}>>> {
    try {
        const supabase = await createClient()
        const { isAdmin } = await checkAdminAccess()

        if (!isAdmin) {
            return { success: false, error: "Admin access required" }
        }

        // Get all groups
        const { data: groups, error: groupsError } = await supabase
            .from("report_groups")
            .select("*")
            .order("created_at", { ascending: false })

        if (groupsError) {
            return { success: false, error: "Failed to fetch groups" }
        }

        // For each group, get member count and reports
        const groupsWithReports = await Promise.all(
            (groups || []).map(async (group) => {
                const { data: members } = await supabase
                    .from("report_group_members")
                    .select("report_id")
                    .eq("group_id", group.id)

                const reportIds = members?.map(m => m.report_id) || []

                const { data: reports } = await supabase
                    .from("incident_reports")
                    .select("*")
                    .in("id", reportIds)

                return {
                    group,
                    reportCount: reportIds.length,
                    reports: reports || []
                }
            })
        )

        return { success: true, data: groupsWithReports }
    } catch (error) {
        console.error("Unexpected error in getAllReportGroups:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}
