"use server"

import type { Enums } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface BulkImportRow {
    fullName: string
    phone?: string
    email?: string
    rentalCategory?: string
    incidentType?: string
    incidentDate?: string
    summary?: string
    amountInvolved?: number
}

export interface BulkImportResult {
    success: boolean
    totalRows: number
    successCount: number
    failedCount: number
    errors: Array<{ row: number; name: string; error: string }>
    reportIds: string[]
}

const VALID_INCIDENT_TYPES = [
    "NON_RETURN", "UNPAID_BALANCE", "LATE_PAYMENT", "SCAM",
    "DAMAGE_DISPUTE", "PROPERTY_DAMAGE", "CONTRACT_VIOLATION",
    "FAKE_INFO", "NO_SHOW", "ABUSIVE_BEHAVIOR", "THREATS_HARASSMENT", "OTHER"
]

const VALID_RENTAL_CATEGORIES = [
    "CAMERA_EQUIPMENT", "CLOTHING_FASHION", "ELECTRONICS_GADGETS",
    "VEHICLE_CAR", "VEHICLE_MOTORCYCLE", "VEHICLE_BICYCLE",
    "REAL_ESTATE_CONDO", "REAL_ESTATE_HOUSE", "REAL_ESTATE_ROOM",
    "FURNITURE_APPLIANCES", "EVENTS_PARTY", "TOOLS_EQUIPMENT",
    "SPORTS_OUTDOOR", "JEWELRY_ACCESSORIES", "BABY_KIDS", "OTHER"
]

/**
 * Parse CSV text into rows of BulkImportRow
 * Expected columns: full_name, phone, email, rental_category, incident_type, incident_date, summary, amount_involved
 */
export async function parseCsvText(csvText: string): Promise<{ rows: BulkImportRow[]; parseErrors: string[] }> {
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) {
        return { rows: [], parseErrors: ["CSV must have a header row and at least one data row."] }
    }

    const parseErrors: string[] = []
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, "_"))

    const nameIdx = headers.findIndex(h => h.includes("name") || h === "full_name")
    const phoneIdx = headers.findIndex(h => h.includes("phone"))
    const emailIdx = headers.findIndex(h => h.includes("email"))
    const categoryIdx = headers.findIndex(h => h.includes("category") || h.includes("rental"))
    const typeIdx = headers.findIndex(h => h.includes("type") || h.includes("incident"))
    const dateIdx = headers.findIndex(h => h.includes("date"))
    const summaryIdx = headers.findIndex(h => h.includes("summary") || h.includes("description") || h.includes("notes"))
    const amountIdx = headers.findIndex(h => h.includes("amount"))

    if (nameIdx === -1) {
        return { rows: [], parseErrors: ["CSV must have a 'full_name' or 'name' column."] }
    }

    const rows: BulkImportRow[] = []

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Handle quoted CSV values
        const cols = parseCSVLine(line)

        const fullName = nameIdx >= 0 ? cols[nameIdx]?.trim() : ""
        if (!fullName) {
            parseErrors.push(`Row ${i + 1}: Missing full name, skipped.`)
            continue
        }

        const phone = phoneIdx >= 0 ? cols[phoneIdx]?.trim() : undefined
        const email = emailIdx >= 0 ? cols[emailIdx]?.trim() : undefined

        if (!phone && !email) {
            parseErrors.push(`Row ${i + 1} (${fullName}): No phone or email provided, skipped.`)
            continue
        }

        const rawCategory = categoryIdx >= 0 ? cols[categoryIdx]?.trim().toUpperCase().replace(/\s+/g, "_") : undefined
        const rentalCategory = rawCategory && VALID_RENTAL_CATEGORIES.includes(rawCategory) ? rawCategory : "OTHER"

        const rawType = typeIdx >= 0 ? cols[typeIdx]?.trim().toUpperCase().replace(/\s+/g, "_") : undefined
        const incidentType = rawType && VALID_INCIDENT_TYPES.includes(rawType) ? rawType : "OTHER"

        const rawDate = dateIdx >= 0 ? cols[dateIdx]?.trim() : undefined
        const incidentDate = rawDate ? normalizeDate(rawDate) : new Date().toISOString().split("T")[0]

        const summary = summaryIdx >= 0 ? cols[summaryIdx]?.trim() : undefined
        const rawAmount = amountIdx >= 0 ? cols[amountIdx]?.trim() : undefined
        const amountInvolved = rawAmount ? parseFloat(rawAmount.replace(/[^0-9.]/g, "")) : undefined

        rows.push({
            fullName,
            phone: phone || undefined,
            email: email || undefined,
            rentalCategory,
            incidentType,
            incidentDate,
            summary: summary || `Incident reported via bulk import.`,
            amountInvolved: isNaN(amountInvolved as number) ? undefined : amountInvolved,
        })
    }

    return { rows, parseErrors }
}

function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
            result.push(current)
            current = ""
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

function normalizeDate(dateStr: string): string {
    // Try to parse various date formats
    const cleaned = dateStr.trim()
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
    // MM/DD/YYYY
    const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mmddyyyy) return `${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, "0")}-${mmddyyyy[2].padStart(2, "0")}`
    // DD-MM-YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`
    // Fallback: try Date constructor
    const d = new Date(cleaned)
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0]
    // Default to today
    return new Date().toISOString().split("T")[0]
}

/**
 * Submit multiple incident reports from a parsed CSV
 */
export async function submitBulkImport(rows: BulkImportRow[]): Promise<BulkImportResult> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return {
            success: false,
            totalRows: rows.length,
            successCount: 0,
            failedCount: rows.length,
            errors: [{ row: 0, name: "Auth", error: "You must be logged in to submit reports." }],
            reportIds: [],
        }
    }

    const errors: Array<{ row: number; name: string; error: string }> = []
    const reportIds: string[] = []
    let successCount = 0

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
            const allPhones = row.phone ? [row.phone] : []
            const allEmails = row.email ? [row.email] : []

            const { data: report, error: insertError } = await supabase
                .from("incident_reports")
                .insert({
                    reporter_id: user.id,
                    reporter_email: user.email,
                    reported_full_name: row.fullName.trim(),
                    reported_phone: allPhones[0] || null,
                    reported_email: allEmails[0] || null,
                    reported_phones: allPhones.length > 0 ? allPhones : null,
                    reported_emails: allEmails.length > 0 ? allEmails : null,
                    rental_category: (row.rentalCategory || "OTHER") as Enums<"rental_category">,
                    incident_type: (row.incidentType || "OTHER") as Enums<"incident_type">,
                    incident_date: row.incidentDate || new Date().toISOString().split("T")[0],
                    amount_involved: row.amountInvolved || null,
                    summary: row.summary || "Incident reported via bulk import.",
                    confirmed_truthful: true,
                    confirmed_consequences: true,
                    status: "PENDING",
                    submitted_at: new Date().toISOString(),
                })
                .select("id")
                .single()

            if (insertError || !report) {
                errors.push({ row: i + 1, name: row.fullName, error: insertError?.message || "Insert failed" })
                continue
            }

            // Insert identifiers for matching
            const identifiers: Array<{ report_id: string; identifier_type: string; identifier_value: string; identifier_normalized: string }> = []

            for (const phone of allPhones) {
                if (phone) {
                    identifiers.push({
                        report_id: report.id,
                        identifier_type: "PHONE",
                        identifier_value: phone,
                        identifier_normalized: phone.replace(/[^\d+]/g, ""),
                    })
                }
            }

            for (const email of allEmails) {
                if (email) {
                    identifiers.push({
                        report_id: report.id,
                        identifier_type: "EMAIL",
                        identifier_value: email,
                        identifier_normalized: email.toLowerCase(),
                    })
                }
            }

            if (identifiers.length > 0) {
                await supabase.from("report_identifiers").insert(identifiers)
            }

            reportIds.push(report.id)
            successCount++
        } catch (err: any) {
            errors.push({ row: i + 1, name: row.fullName, error: err.message || "Unknown error" })
        }
    }

    revalidatePath("/my-reports")

    return {
        success: successCount > 0,
        totalRows: rows.length,
        successCount,
        failedCount: rows.length - successCount,
        errors,
        reportIds,
    }
}
