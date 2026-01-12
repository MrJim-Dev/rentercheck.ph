"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Database, Enums } from "@/lib/database.types"

// Types for the form submission
export interface ReportFormData {
    // Renter identification (required)
    fullName: string
    phone?: string
    email?: string
    facebookLink?: string

    // Additional renter details (optional)
    renterAddress?: string
    renterCity?: string
    renterBirthdate?: string

    // Incident details
    incidentType: Enums<"incident_type">
    incidentDate: string
    amountInvolved?: number

    // Incident location
    incidentRegion?: string
    incidentCity?: string
    incidentPlace?: string

    // Summary
    summary: string

    // Confirmations
    confirmTruth: boolean
    confirmBan: boolean
}

export interface EvidenceFile {
    reportId: string
    type: Enums<"evidence_type">
    fileName: string
    fileSize: number
    mimeType: string
    storagePath: string
}

// Response types
interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

/**
 * Submit a new incident report
 */
export async function submitIncidentReport(
    formData: ReportFormData
): Promise<ActionResult<{ reportId: string }>> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in to submit a report" }
        }

        // Validate required fields
        if (!formData.fullName.trim()) {
            return { success: false, error: "Full name is required" }
        }

        if (!formData.phone && !formData.email && !formData.facebookLink) {
            return { success: false, error: "At least one identifier (phone, email, or Facebook link) is required" }
        }

        if (!formData.incidentType || !formData.incidentDate || !formData.summary.trim()) {
            return { success: false, error: "Incident type, date, and summary are required" }
        }

        if (!formData.confirmTruth || !formData.confirmBan) {
            return { success: false, error: "You must confirm both acknowledgements" }
        }

        // Create the incident report
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .insert({
                reporter_id: user.id,
                reporter_email: user.email,
                reported_full_name: formData.fullName.trim(),
                reported_phone: formData.phone?.trim() || null,
                reported_email: formData.email?.trim() || null,
                reported_facebook: formData.facebookLink?.trim() || null,
                reported_address: formData.renterAddress?.trim() || null,
                reported_city: formData.renterCity?.trim() || null,
                reported_date_of_birth: formData.renterBirthdate || null,
                incident_type: formData.incidentType,
                incident_date: formData.incidentDate,
                amount_involved: formData.amountInvolved || null,
                incident_region: formData.incidentRegion || null,
                incident_city: formData.incidentCity || null,
                incident_place: formData.incidentPlace?.trim() || null,
                summary: formData.summary.trim(),
                confirmed_truthful: formData.confirmTruth,
                confirmed_consequences: formData.confirmBan,
                status: "PENDING",
                submitted_at: new Date().toISOString(),
            })
            .select("id")
            .single()

        if (reportError) {
            console.error("Error creating report:", reportError)
            return { success: false, error: "Failed to create report. Please try again." }
        }

        // Create report identifiers for matching
        const identifiers: Array<{
            report_id: string
            identifier_type: Enums<"identifier_type">
            identifier_value: string
            identifier_normalized: string
        }> = []

        if (formData.phone) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "PHONE",
                identifier_value: formData.phone,
                identifier_normalized: formData.phone.replace(/[^\d]/g, ""), // Will be normalized by trigger
            })
        }

        if (formData.email) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "EMAIL",
                identifier_value: formData.email,
                identifier_normalized: formData.email.toLowerCase(),
            })
        }

        if (formData.facebookLink) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "FACEBOOK",
                identifier_value: formData.facebookLink,
                identifier_normalized: formData.facebookLink.toLowerCase(),
            })
        }

        if (identifiers.length > 0) {
            const { error: identifierError } = await supabase
                .from("report_identifiers")
                .insert(identifiers)

            if (identifierError) {
                console.error("Error creating identifiers:", identifierError)
                // Non-critical error, continue
            }
        }

        revalidatePath("/report")

        return { success: true, data: { reportId: report.id } }
    } catch (error) {
        console.error("Unexpected error in submitIncidentReport:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Upload evidence file for a report
 */
export async function uploadEvidence(
    reportId: string,
    evidenceType: Enums<"evidence_type">,
    file: File
): Promise<ActionResult<{ evidenceId: string; storagePath: string }>> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in to upload evidence" }
        }

        // Verify the report belongs to this user
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select("id, status")
            .eq("id", reportId)
            .eq("reporter_id", user.id)
            .single()

        if (reportError || !report) {
            return { success: false, error: "Report not found or access denied" }
        }

        if (report.status !== "PENDING" && report.status !== "DRAFT") {
            return { success: false, error: "Cannot upload evidence to this report" }
        }

        // Generate unique file path
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const storagePath = `${user.id}/${reportId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
            })

        if (uploadError) {
            console.error("Error uploading file:", uploadError)
            return { success: false, error: "Failed to upload file. Please try again." }
        }

        // Create evidence record
        const { data: evidence, error: evidenceError } = await supabase
            .from("report_evidence")
            .insert({
                report_id: reportId,
                evidence_type: evidenceType,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                storage_path: storagePath,
                storage_bucket: "evidence",
                uploaded_by: user.id,
            })
            .select("id")
            .single()

        if (evidenceError) {
            console.error("Error creating evidence record:", evidenceError)
            // Try to delete the uploaded file
            await supabase.storage.from("evidence").remove([storagePath])
            return { success: false, error: "Failed to save evidence record. Please try again." }
        }

        return { success: true, data: { evidenceId: evidence.id, storagePath } }
    } catch (error) {
        console.error("Unexpected error in uploadEvidence:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Delete evidence file from a report
 */
export async function deleteEvidence(evidenceId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Get the evidence record
        const { data: evidence, error: evidenceError } = await supabase
            .from("report_evidence")
            .select("id, storage_path, report_id")
            .eq("id", evidenceId)
            .eq("uploaded_by", user.id)
            .single()

        if (evidenceError || !evidence) {
            return { success: false, error: "Evidence not found or access denied" }
        }

        // Verify the report is still editable
        const { data: report } = await supabase
            .from("incident_reports")
            .select("status")
            .eq("id", evidence.report_id)
            .single()

        if (report?.status !== "PENDING" && report?.status !== "DRAFT") {
            return { success: false, error: "Cannot delete evidence from this report" }
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from("evidence")
            .remove([evidence.storage_path])

        if (storageError) {
            console.error("Error deleting file:", storageError)
        }

        // Delete the record
        const { error: deleteError } = await supabase
            .from("report_evidence")
            .delete()
            .eq("id", evidenceId)

        if (deleteError) {
            return { success: false, error: "Failed to delete evidence" }
        }

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in deleteEvidence:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get user's submitted reports
 */
export async function getMyReports(): Promise<ActionResult<Database["public"]["Views"]["my_reports"]["Row"][]>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        const { data: reports, error: reportsError } = await supabase
            .from("my_reports")
            .select("*")
            .order("created_at", { ascending: false })

        if (reportsError) {
            console.error("Error fetching reports:", reportsError)
            return { success: false, error: "Failed to fetch reports" }
        }

        return { success: true, data: reports || [] }
    } catch (error) {
        console.error("Unexpected error in getMyReports:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get evidence files for a specific report
 */
export async function getReportEvidence(reportId: string): Promise<ActionResult<Database["public"]["Tables"]["report_evidence"]["Row"][]>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Verify report ownership
        const { data: report } = await supabase
            .from("incident_reports")
            .select("id")
            .eq("id", reportId)
            .eq("reporter_id", user.id)
            .single()

        if (!report) {
            return { success: false, error: "Report not found or access denied" }
        }

        const { data: evidence, error: evidenceError } = await supabase
            .from("report_evidence")
            .select("*")
            .eq("report_id", reportId)
            .order("display_order", { ascending: true })

        if (evidenceError) {
            console.error("Error fetching evidence:", evidenceError)
            return { success: false, error: "Failed to fetch evidence" }
        }

        return { success: true, data: evidence || [] }
    } catch (error) {
        console.error("Unexpected error in getReportEvidence:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get a single report's full details
 */
export async function getReportById(reportId: string): Promise<ActionResult<{
    report: Database["public"]["Tables"]["incident_reports"]["Row"]
    evidence: Database["public"]["Tables"]["report_evidence"]["Row"][]
    infoRequests: Database["public"]["Tables"]["report_info_requests"]["Row"][]
}>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Get the report (verify ownership)
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select("*")
            .eq("id", reportId)
            .eq("reporter_id", user.id)
            .single()

        if (reportError || !report) {
            return { success: false, error: "Report not found or access denied" }
        }

        // Get evidence
        const { data: evidence } = await supabase
            .from("report_evidence")
            .select("*")
            .eq("report_id", reportId)
            .order("display_order", { ascending: true })

        // Get info requests
        const { data: infoRequests } = await supabase
            .from("report_info_requests")
            .select("*")
            .eq("report_id", reportId)
            .order("created_at", { ascending: false })

        return {
            success: true,
            data: {
                report,
                evidence: evidence || [],
                infoRequests: infoRequests || [],
            },
        }
    } catch (error) {
        console.error("Unexpected error in getReportById:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get signed URL for viewing evidence file
 */
export async function getEvidenceUrl(storagePath: string): Promise<ActionResult<{ url: string }>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Create a signed URL valid for 1 hour
        const { data, error } = await supabase.storage
            .from("evidence")
            .createSignedUrl(storagePath, 3600)

        if (error || !data) {
            return { success: false, error: "Failed to get file URL" }
        }

        return { success: true, data: { url: data.signedUrl } }
    } catch (error) {
        console.error("Unexpected error in getEvidenceUrl:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}
