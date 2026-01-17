"use server"

import { DisputeApprovedEmail } from "@/components/emails/dispute-approved"
import { sendEmail } from "@/lib/email"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkIsAdmin } from "./admin"

import { DisputeCategory } from "@/lib/disputes"

export type DisputeResult<T = undefined> = {
    success: boolean
    error?: string
    data?: T
}

export async function submitDispute(reportId: string, reason: string, category: DisputeCategory): Promise<DisputeResult<{ disputeId: string }>> {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: "You must be logged in to submit a dispute" }
    }

    // Check if already disputed
    const { data: existingDispute } = await supabase
        .from("incident_disputes")
        .select("id")
        .eq("report_id", reportId)
        .eq("disputer_id", user.id)
        .single()

    if (existingDispute) {
        return { success: false, error: "You have already disputed this report" }
    }

    // Insert dispute
    const { data: dispute, error: insertError } = await supabase
        .from("incident_disputes")
        .insert({
            report_id: reportId,
            disputer_id: user.id,
            category: category,
            reason: reason,
            status: 'OPEN'
        })
        .select("id")
        .single()

    if (insertError) {
        console.error("Error submitting dispute:", insertError)
        return { success: false, error: "Failed to submit dispute" }
    }

    // Update report status to DISPUTED
    const { error: updateError } = await supabase
        .from("incident_reports")
        .update({ status: 'DISPUTED' })
        .eq("id", reportId)

    if (updateError) {
        console.error("Error updating report status:", updateError)
    }

    revalidatePath("/search")

    return { success: true, data: { disputeId: dispute.id } }
}

export async function uploadDisputeEvidence(
    disputeId: string,
    file: File
): Promise<DisputeResult<{ evidenceId: string; storagePath: string }>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Unauthorized" }

        // Verify ownership
        const { data: dispute } = await supabase
            .from("incident_disputes")
            .select("id")
            .eq("id", disputeId)
            .eq("disputer_id", user.id)
            .single()

        if (!dispute) return { success: false, error: "Dispute not found" }

        // Security check for file type
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            return { success: false, error: "Invalid file type" }
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/disputes/${disputeId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
            })

        if (uploadError) {
            console.error("Error uploading file:", uploadError)
            return { success: false, error: "Failed to upload file" }
        }

        // Create evidence record in dispute_evidence table
        const { data: evidence, error: evidenceError } = await supabase
            .from("dispute_evidence")
            .insert({
                dispute_id: disputeId,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                storage_path: filePath,
                storage_bucket: "evidence",
                uploaded_by: user.id,
            })
            .select("id")
            .single()

        if (evidenceError) {
            console.error("Error creating evidence record:", evidenceError)
            // Try to delete the uploaded file
            await supabase.storage.from("evidence").remove([filePath])
            return { success: false, error: "Failed to save evidence record" }
        }

        return { success: true, data: { evidenceId: evidence.id, storagePath: filePath } }
    } catch (e) {
        console.error("Upload error:", e)
        return { success: false, error: "Unexpected error" }
    }
}

export async function resolveDispute(disputeId: string, decision: 'APPROVED' | 'REJECTED', reportId: string): Promise<DisputeResult> {
    // 1. Check Admin
    const adminCheck = await checkIsAdmin()
    if (!adminCheck.success || !adminCheck.data?.isAdmin) {
        return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()

    if (decision === 'APPROVED') {
        // APPROVE DISPUTE = SOFT DELETE REPORT

        // 1. Update Dispute Status to APPROVED
        const { error: updateDisputeError } = await supabase
            .from("incident_disputes")
            .update({ status: 'APPROVED' })
            .eq("id", disputeId)

        if (updateDisputeError) {
            return { success: false, error: "Failed to update dispute status" }
        }

        // 2. Update Report Status to DELETED (Soft Delete)
        const { error: deleteError } = await supabase
            .from("incident_reports")
            .update({ status: 'DELETED' })
            .eq("id", reportId)

        if (deleteError) {
            return { success: false, error: "Failed to soft delete report" }
        }

        // Send Email if Approved
        // Send Email if Approved
        const { data: disputeData } = await supabase
            .from("incident_disputes")
            .select("disputer_id")
            .eq("id", disputeId)
            .single()

        if (disputeData?.disputer_id) {
            const adminClient = createAdminClient()
            const { data: { user: disputer } } = await adminClient.auth.admin.getUserById(disputeData.disputer_id)

            if (disputer?.email) {
                await sendEmail({
                    to: disputer.email,
                    subject: 'Your Dispute has been Approved',
                    react: DisputeApprovedEmail({
                        reportId: reportId
                    })
                })
            }
        }

    } else {
        // REJECT DISPUTE = KEEP REPORT
        // 1. Update Dispute Status
        const { error: updateDisputeError } = await supabase
            .from("incident_disputes")
            .update({ status: 'REJECTED' })
            .eq("id", disputeId)

        if (updateDisputeError) return { success: false, error: "Failed to update dispute" }

        // 2. Revert Report Status
        const { error: updateReportError } = await supabase
            .from("incident_reports")
            .update({ status: 'PENDING' })
            .eq("id", reportId)
    }

    revalidatePath("/admin")
    return { success: true }
}
