"use server"

import { CreditAction, gateAction } from "@/lib/credits/gatekeeper"
import type { Database, Enums } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"
import { NewReportAdminEmail } from "@/components/emails/new-report-admin"

// Types for the form submission
export interface ReportFormData {
    // Renter identification (required)
    fullName: string
    phone?: string
    email?: string
    facebookLink?: string

    // Multiple identifiers (optional - arrays for additional values)
    aliases?: string[]           // Alternative names/aliases
    additionalPhones?: string[]  // Additional phone numbers
    additionalEmails?: string[]  // Additional email addresses
    additionalFacebooks?: string[] // Additional Facebook profiles

    // Additional renter details (optional)
    renterAddress?: string
    renterCity?: string
    renterBirthdate?: string

    // Rental item details
    rentalCategory?: Enums<"rental_category">
    rentalItemDescription?: string

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

// Helper type for displaying identifiers
export interface RenterIdentifiers {
    phones: string[]
    emails: string[]
    facebooks: string[]
    aliases: string[]
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
            return { success: false, error: "You must be logged in to submit a report. Please sign in or create an account to continue." }
        }

        // Validate required fields
        if (!formData.fullName.trim()) {
            return { success: false, error: "Renter's full name is required. Please provide the name of the person you're reporting." }
        }

        // Check if at least one identifier is provided (contact method OR date of birth)
        if (!formData.phone && !formData.email && !formData.facebookLink && !formData.renterBirthdate) {
            return { success: false, error: "At least one contact method is required to identify the renter. Please provide a phone number, email address, or Facebook profile link." }
        }

        if (!formData.incidentType || !formData.incidentDate || !formData.summary.trim()) {
            const missing = [];
            if (!formData.incidentType) missing.push("incident type");
            if (!formData.incidentDate) missing.push("incident date");
            if (!formData.summary.trim()) missing.push("incident summary");
            return { success: false, error: `Missing required information: ${missing.join(", ")}. Please complete all required fields.` }
        }

        if (!formData.confirmTruth || !formData.confirmBan) {
            return { success: false, error: "You must confirm that your report is truthful and acknowledge the consequences of submitting false information." }
        }

        // =================================================================
        // CREDIT CONSUMPTION GATE
        // =================================================================
        // Deduct credit for report creation (Configuration driven)
        // Uses the centralized gateAction helper which handles caching & atomic deduction
        try {
            await gateAction(CreditAction.REPORT_CREATION, user.id)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'INSUFFICIENT_CREDITS' || errorMessage.includes('Insufficient credits')) {
                return { success: false, error: "You don't have enough credits to submit this report. Credits refill for free daily. Please check your credit balance and try again later or contact support if you believe this is an error." }
            }
            throw error // Re-throw other errors to be caught below
        }
        // =================================================================

        // Prepare JSONB arrays for multiple identifiers
        // Filter out empty strings and combine primary + additional values
        const allPhones = [
            formData.phone?.trim(),
            ...(formData.additionalPhones || []).map(p => p.trim())
        ].filter(Boolean) as string[]

        const allEmails = [
            formData.email?.trim(),
            ...(formData.additionalEmails || []).map(e => e.trim())
        ].filter(Boolean) as string[]

        const allFacebooks = [
            formData.facebookLink?.trim(),
            ...(formData.additionalFacebooks || []).map(f => f.trim())
        ].filter(Boolean) as string[]

        const allAliases = (formData.aliases || [])
            .map(a => a.trim())
            .filter(Boolean) as string[]

        // Create the incident report with JSONB arrays
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .insert({
                reporter_id: user.id,
                reporter_email: user.email,
                reported_full_name: formData.fullName.trim(),
                // Primary identifiers (first value or null)
                reported_phone: allPhones[0] || null,
                reported_email: allEmails[0] || null,
                reported_facebook: allFacebooks[0] || null,
                // JSONB arrays for all identifiers (including primary)
                reported_phones: allPhones.length > 0 ? allPhones : null,
                reported_emails: allEmails.length > 0 ? allEmails : null,
                reported_facebooks: allFacebooks.length > 0 ? allFacebooks : null,
                reported_aliases: allAliases.length > 0 ? allAliases : null,
                // Other fields
                reported_address: formData.renterAddress?.trim() || null,
                reported_city: formData.renterCity?.trim() || null,
                reported_date_of_birth: formData.renterBirthdate || null,
                rental_category: formData.rentalCategory || null,
                rental_item_description: formData.rentalItemDescription?.trim() || null,
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
            return { success: false, error: "Failed to save your report to the database. This may be due to a technical issue. Please try again in a few moments or contact support if the problem persists." }
        }

        // Create report identifiers for matching (all phones, emails, facebooks)
        const identifiers: Array<{
            report_id: string
            identifier_type: Enums<"identifier_type">
            identifier_value: string
            identifier_normalized: string
        }> = []

        // Add all phones
        for (const phone of allPhones) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "PHONE",
                identifier_value: phone,
                identifier_normalized: phone.replace(/[^\d+]/g, ""),
            })
        }

        // Add all emails
        for (const email of allEmails) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "EMAIL",
                identifier_value: email,
                identifier_normalized: email.toLowerCase(),
            })
        }

        // Add all facebooks
        for (const facebook of allFacebooks) {
            identifiers.push({
                report_id: report.id,
                identifier_type: "FACEBOOK",
                identifier_value: facebook,
                identifier_normalized: facebook.toLowerCase(),
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

        // Revalidate paths to refresh data
        revalidatePath("/report")
        revalidatePath("/my-reports")

        // Send admin notification email
        try {
            await sendEmail({
                to: 'mrjim.development@gmail.com',
                subject: `New Report Submitted - ${formData.fullName}`,
                react: NewReportAdminEmail({
                    reportId: report.id,
                    reportedName: formData.fullName,
                    reporterEmail: user.email || 'Unknown',
                    incidentType: formData.incidentType,
                    incidentDate: formData.incidentDate,
                    summary: formData.summary,
                    amountInvolved: formData.amountInvolved,
                }),
            });
        } catch (emailError) {
            console.error("Error sending admin notification email:", emailError);
            // Don't fail the report submission if email fails
        }

        // Note: Client-side cache should be cleared using clearReportsCache() 
        // from @/lib/cache after successful submission

        return { success: true, data: { reportId: report.id } }
    } catch (error) {
        console.error("Unexpected error in submitIncidentReport:", error)
        return { success: false, error: "An unexpected error occurred while processing your report. Please try again. If the issue continues, please contact support with details about what you were trying to do." }
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
            return { success: false, error: "You must be logged in to upload evidence files. Please refresh the page and try again." }
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

        // Query incident_reports directly instead of the view for better RLS handling
        const { data: reports, error: reportsError } = await supabase
            .from("incident_reports")
            .select(`
                *,
                renter:renters(full_name, fingerprint)
            `)
            .eq("reporter_id", user.id)
            .order("created_at", { ascending: false })

        if (reportsError) {
            console.error("Error fetching reports:", reportsError)
            return { success: false, error: "Failed to fetch reports" }
        }

        // Transform the data to match the view structure
        const transformedReports = (reports || []).map(report => ({
            ...report,
            renter_name: (report.renter as { full_name: string | null } | null)?.full_name || null,
            renter_fingerprint: (report.renter as { fingerprint: string | null } | null)?.fingerprint || null,
            evidence_count: 0, // Will be populated separately if needed
            pending_requests: 0, // Will be populated separately if needed
        }))

        return { success: true, data: transformedReports as Database["public"]["Views"]["my_reports"]["Row"][] }
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
    amendments: Database["public"]["Tables"]["report_amendments"]["Row"][]
    amendmentEvidence: Record<string, Database["public"]["Tables"]["report_evidence"]["Row"][]>
}>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Check if user is an admin
        const { data: adminUser } = await supabase
            .from("admin_users")
            .select("role, is_active")
            .eq("id", user.id)
            .single()

        const isAdmin = adminUser?.is_active === true

        // Get the report (verify ownership or admin access)
        let reportQuery = supabase
            .from("incident_reports")
            .select("*")
            .eq("id", reportId)

        // If not admin, restrict to user's own reports
        if (!isAdmin) {
            reportQuery = reportQuery.eq("reporter_id", user.id)
        }

        const { data: report, error: reportError } = await reportQuery.single()

        if (reportError || !report) {
            return { success: false, error: "Report not found or access denied" }
        }

        // Get evidence (only those NOT attached to amendments)
        const { data: evidence } = await supabase
            .from("report_evidence")
            .select("*")
            .eq("report_id", reportId)
            .is("amendment_id", null)
            .order("display_order", { ascending: true })

        // Get info requests
        const { data: infoRequests } = await supabase
            .from("report_info_requests")
            .select("*")
            .eq("report_id", reportId)
            .order("created_at", { ascending: false })

        // Get amendments
        const { data: amendments } = await supabase
            .from("report_amendments")
            .select("*")
            .eq("report_id", reportId)
            .order("created_at", { ascending: false })

        // Get evidence for amendments
        const amendmentEvidence: Record<string, Database["public"]["Tables"]["report_evidence"]["Row"][]> = {}

        if (amendments && amendments.length > 0) {
            const { data: amendEvidence } = await supabase
                .from("report_evidence")
                .select("*")
                .in("amendment_id", amendments.map(a => a.id))
                .order("uploaded_at", { ascending: true })

            if (amendEvidence) {
                for (const ev of amendEvidence) {
                    if (ev.amendment_id) {
                        if (!amendmentEvidence[ev.amendment_id]) {
                            amendmentEvidence[ev.amendment_id] = []
                        }
                        amendmentEvidence[ev.amendment_id].push(ev)
                    }
                }
            }
        }

        return {
            success: true,
            data: {
                report,
                evidence: evidence || [],
                infoRequests: infoRequests || [],
                amendments: amendments || [],
                amendmentEvidence,
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

// ============================================
// AMENDMENT FUNCTIONS
// ============================================

export interface AmendmentFormData {
    reportId: string
    amendmentType: Enums<"amendment_type">
    changes: {
        // For ADDITIONAL_INFO or CORRECTION
        summary?: string
        renterAddress?: string
        renterCity?: string
        renterBirthdate?: string
        // Single identifier (backwards compatible)
        phone?: string
        email?: string
        facebookLink?: string
        // Multiple identifiers
        phones?: string[]
        emails?: string[]
        facebookLinks?: string[]
        // For any additional text notes
        additionalNotes?: string
    }
    reporterNotes?: string
}

/**
 * Create a new amendment for a report
 */
export async function createAmendment(
    formData: AmendmentFormData
): Promise<ActionResult<{ amendmentId: string }>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Verify the report belongs to this user
        const { data: report, error: reportError } = await supabase
            .from("incident_reports")
            .select("id, status")
            .eq("id", formData.reportId)
            .eq("reporter_id", user.id)
            .single()

        if (reportError || !report) {
            return { success: false, error: "Report not found or access denied" }
        }

        // Create the amendment
        const { data: amendment, error: amendmentError } = await supabase
            .from("report_amendments")
            .insert({
                report_id: formData.reportId,
                reporter_id: user.id,
                amendment_type: formData.amendmentType,
                changes_json: formData.changes,
                reporter_notes: formData.reporterNotes || null,
                status: "PENDING",
            })
            .select("id")
            .single()

        if (amendmentError) {
            console.error("Error creating amendment:", amendmentError)
            return { success: false, error: "Failed to create amendment" }
        }

        revalidatePath(`/my-reports/${formData.reportId}`)

        return { success: true, data: { amendmentId: amendment.id } }
    } catch (error) {
        console.error("Unexpected error in createAmendment:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Upload evidence file for an amendment
 */
export async function uploadAmendmentEvidence(
    reportId: string,
    amendmentId: string,
    evidenceType: Enums<"evidence_type">,
    file: File
): Promise<ActionResult<{ evidenceId: string; storagePath: string }>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Verify the amendment belongs to this user
        const { data: amendment, error: amendmentError } = await supabase
            .from("report_amendments")
            .select("id, status")
            .eq("id", amendmentId)
            .eq("reporter_id", user.id)
            .single()

        if (amendmentError || !amendment) {
            return { success: false, error: "Amendment not found or access denied" }
        }

        if (amendment.status !== "PENDING") {
            return { success: false, error: "Cannot upload evidence to this amendment" }
        }

        // Generate unique file path
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const storagePath = `${user.id}/${reportId}/amendments/${amendmentId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(storagePath, file, {
                cacheControl: "3600",
                upsert: false,
            })

        if (uploadError) {
            console.error("Error uploading file:", uploadError)
            return { success: false, error: "Failed to upload file" }
        }

        // Create evidence record linked to the amendment
        const { data: evidence, error: evidenceError } = await supabase
            .from("report_evidence")
            .insert({
                report_id: reportId,
                amendment_id: amendmentId,
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
            await supabase.storage.from("evidence").remove([storagePath])
            return { success: false, error: "Failed to save evidence record" }
        }

        revalidatePath(`/my-reports/${reportId}`)

        return { success: true, data: { evidenceId: evidence.id, storagePath } }
    } catch (error) {
        console.error("Unexpected error in uploadAmendmentEvidence:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Get all amendments for a report
 */
export async function getReportAmendments(
    reportId: string
): Promise<ActionResult<{
    amendments: Database["public"]["Tables"]["report_amendments"]["Row"][]
    amendmentEvidence: Record<string, Database["public"]["Tables"]["report_evidence"]["Row"][]>
}>> {
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

        // Get amendments
        const { data: amendments, error: amendmentsError } = await supabase
            .from("report_amendments")
            .select("*")
            .eq("report_id", reportId)
            .order("created_at", { ascending: false })

        if (amendmentsError) {
            console.error("Error fetching amendments:", amendmentsError)
            return { success: false, error: "Failed to fetch amendments" }
        }

        // Get evidence for each amendment
        const amendmentEvidence: Record<string, Database["public"]["Tables"]["report_evidence"]["Row"][]> = {}

        if (amendments && amendments.length > 0) {
            const { data: evidence } = await supabase
                .from("report_evidence")
                .select("*")
                .in("amendment_id", amendments.map(a => a.id))
                .order("uploaded_at", { ascending: true })

            if (evidence) {
                for (const ev of evidence) {
                    if (ev.amendment_id) {
                        if (!amendmentEvidence[ev.amendment_id]) {
                            amendmentEvidence[ev.amendment_id] = []
                        }
                        amendmentEvidence[ev.amendment_id].push(ev)
                    }
                }
            }
        }

        return {
            success: true,
            data: {
                amendments: amendments || [],
                amendmentEvidence,
            },
        }
    } catch (error) {
        console.error("Unexpected error in getReportAmendments:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Delete a pending amendment (only if not yet reviewed)
 */
export async function deleteAmendment(amendmentId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in" }
        }

        // Get the amendment
        const { data: amendment, error: amendmentError } = await supabase
            .from("report_amendments")
            .select("id, status, report_id")
            .eq("id", amendmentId)
            .eq("reporter_id", user.id)
            .single()

        if (amendmentError || !amendment) {
            return { success: false, error: "Amendment not found or access denied" }
        }

        if (amendment.status !== "PENDING") {
            return { success: false, error: "Cannot delete an amendment that has been reviewed" }
        }

        // Delete evidence files first
        const { data: evidence } = await supabase
            .from("report_evidence")
            .select("storage_path")
            .eq("amendment_id", amendmentId)

        if (evidence && evidence.length > 0) {
            await supabase.storage
                .from("evidence")
                .remove(evidence.map(e => e.storage_path))

            await supabase
                .from("report_evidence")
                .delete()
                .eq("amendment_id", amendmentId)
        }

        // Delete the amendment
        const { error: deleteError } = await supabase
            .from("report_amendments")
            .delete()
            .eq("id", amendmentId)

        if (deleteError) {
            return { success: false, error: "Failed to delete amendment" }
        }

        revalidatePath(`/my-reports/${amendment.report_id}`)

        return { success: true }
    } catch (error) {
        console.error("Unexpected error in deleteAmendment:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

/**
 * Update an existing incident report (edit mode)
 * Tracks changes in report_edits table
 */
export async function updateIncidentReport(
    reportId: string,
    formData: ReportFormData
): Promise<ActionResult<{ reportId: string }>> {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "You must be logged in to update a report" }
        }

        // Check if user is an admin
        const { data: adminUser } = await supabase
            .from("admin_users")
            .select("role, is_active")
            .eq("id", user.id)
            .single()

        const isAdmin = adminUser?.is_active === true

        // Get the report (verify ownership or admin access)
        let reportQuery = supabase
            .from("incident_reports")
            .select("*")
            .eq("id", reportId)

        // If not admin, restrict to user's own reports
        if (!isAdmin) {
            reportQuery = reportQuery.eq("reporter_id", user.id)
        }

        const { data: existingReport, error: reportError } = await reportQuery.single()

        if (reportError || !existingReport) {
            return { success: false, error: "Report not found or access denied" }
        }

        // Prepare update data
        const updateData: Partial<Database["public"]["Tables"]["incident_reports"]["Row"]> = {}
        const changes: Record<string, { before: unknown; after: unknown }> = {}

        // Helper to compare values (handles arrays, objects, and primitives)
        const hasChanged = (newVal: unknown, oldVal: unknown): boolean => {
            if (Array.isArray(newVal) && Array.isArray(oldVal)) {
                return JSON.stringify(newVal.sort()) !== JSON.stringify(oldVal.sort())
            }
            if (typeof newVal === 'object' && typeof oldVal === 'object' && newVal !== null && oldVal !== null) {
                return JSON.stringify(newVal) !== JSON.stringify(oldVal)
            }
            return newVal !== oldVal
        }

        // Track simple field updates
        const fieldUpdates: Record<string, unknown> = {
            reported_full_name: formData.fullName,
            reported_address: formData.renterAddress,
            reported_city: formData.renterCity,
            reported_date_of_birth: formData.renterBirthdate,
            rental_category: formData.rentalCategory,
            rental_item_description: formData.rentalItemDescription,
            incident_type: formData.incidentType,
            incident_date: formData.incidentDate,
            amount_involved: formData.amountInvolved,
            incident_region: formData.incidentRegion,
            incident_city: formData.incidentCity,
            incident_place: formData.incidentPlace,
            summary: formData.summary,
        }

        // Check simple fields
        for (const [dbField, newValue] of Object.entries(fieldUpdates)) {
            const oldValue = (existingReport as Record<string, unknown>)[dbField]
            if (hasChanged(newValue, oldValue)) {
                (updateData as Record<string, unknown>)[dbField] = newValue
                changes[dbField] = { before: oldValue, after: newValue }
            }
        }

        // Handle array fields - combine primary + additional into full arrays
        const allPhones = [formData.phone, ...(formData.additionalPhones || [])].filter(Boolean)
        const allEmails = [formData.email, ...(formData.additionalEmails || [])].filter(Boolean)
        const allFacebooks = [formData.facebookLink, ...(formData.additionalFacebooks || [])].filter(Boolean)

        // Get existing full arrays for comparison
        const existingPhones = [existingReport.reported_phone, ...(existingReport.reported_phones as string[] || [])].filter(Boolean)
        const existingEmails = [existingReport.reported_email, ...(existingReport.reported_emails as string[] || [])].filter(Boolean)
        const existingFacebooks = [existingReport.reported_facebook, ...(existingReport.reported_facebooks as string[] || [])].filter(Boolean)

        // Check phone array
        if (hasChanged(allPhones, existingPhones)) {
            updateData.reported_phone = allPhones[0] || null
            updateData.reported_phones = allPhones.slice(1) as unknown as Database["public"]["Tables"]["incident_reports"]["Row"]["reported_phones"]
            changes.reported_phones = {
                before: existingPhones,
                after: allPhones,
            }
        }

        // Check email array
        if (hasChanged(allEmails, existingEmails)) {
            updateData.reported_email = allEmails[0] || null
            updateData.reported_emails = allEmails.slice(1) as unknown as Database["public"]["Tables"]["incident_reports"]["Row"]["reported_emails"]
            changes.reported_emails = {
                before: existingEmails,
                after: allEmails,
            }
        }

        // Check facebook array
        if (hasChanged(allFacebooks, existingFacebooks)) {
            updateData.reported_facebook = allFacebooks[0] || null
            updateData.reported_facebooks = allFacebooks.slice(1) as unknown as Database["public"]["Tables"]["incident_reports"]["Row"]["reported_facebooks"]
            changes.reported_facebooks = {
                before: existingFacebooks,
                after: allFacebooks,
            }
        }

        // Check aliases
        if (hasChanged(formData.aliases || [], existingReport.reported_aliases || [])) {
            updateData.reported_aliases = (formData.aliases || []) as unknown as Database["public"]["Tables"]["incident_reports"]["Row"]["reported_aliases"]
            changes.reported_aliases = {
                before: existingReport.reported_aliases,
                after: formData.aliases,
            }
        }

        // If nothing changed, no need to update
        if (Object.keys(updateData).length === 0) {
            return { success: true, data: { reportId } }
        }

        // Update the report
        const { error: updateError } = await supabase
            .from("incident_reports")
            .update(updateData)
            .eq("id", reportId)

        if (updateError) {
            console.error("Error updating report:", updateError)
            return { success: false, error: "Failed to update report" }
        }

        // Create edit history record
        const changeNote = isAdmin 
            ? "Admin updated report details via admin panel" 
            : "Reporter updated report details via edit form"
        
        const { error: historyError } = await supabase
            .from("report_edits")
            .insert({
                report_id: reportId,
                edited_by: user.id,
                changes,
                change_note: changeNote,
            })

        if (historyError) {
            console.error("Error creating edit history:", historyError)
            // Don't fail the update if history fails
        }

        // Revalidate paths
        revalidatePath(`/my-reports/${reportId}`)
        revalidatePath(`/report?id=${reportId}`)
        revalidatePath("/admin")

        return {
            success: true,
            data: { reportId },
        }
    } catch (error) {
        console.error("Unexpected error in updateIncidentReport:", error)
        return { success: false, error: "An unexpected error occurred" }
    }
}

