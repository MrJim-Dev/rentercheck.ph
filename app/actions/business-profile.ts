"use server"

import { createClient } from "@/lib/supabase/server"

export type BusinessType =
    | "SOLE_PROPRIETORSHIP"
    | "PARTNERSHIP"
    | "CORPORATION"
    | "COOPERATIVE"
    | "INDIVIDUAL"
    | "OTHER"

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"

export interface BusinessProfile {
    id: string
    email: string
    full_name: string | null
    business_name: string | null
    business_type: BusinessType | null
    dti_sec_number: string | null
    business_address: string | null
    contact_number: string | null
    verification_status: VerificationStatus
    verification_submitted_at: string | null
    verification_reviewed_at: string | null
    verification_notes: string | null
    rental_categories: string[]
}

export interface BusinessProfileInput {
    business_name: string
    business_type: BusinessType
    dti_sec_number?: string
    business_address: string
    contact_number: string
    rental_categories: string[]
}

/**
 * Get the current user's business profile.
 */
export async function getBusinessProfile(): Promise<{ success: boolean; profile?: BusinessProfile; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name, business_name, business_type, dti_sec_number, business_address, contact_number, verification_status, verification_submitted_at, verification_reviewed_at, verification_notes, rental_categories")
            .eq("id", user.id)
            .single()

        if (error) {
            return { success: false, error: error.message }
        }

        return {
            success: true,
            profile: {
                ...data,
                verification_status: (data.verification_status as VerificationStatus) || "UNVERIFIED",
                rental_categories: (data.rental_categories as string[]) || [],
            }
        }
    } catch (error) {
        console.error("Error fetching business profile:", error)
        return { success: false, error: "Failed to fetch business profile" }
    }
}

/**
 * Save/update the user's business profile (draft, not yet submitted for verification).
 */
export async function saveBusinessProfile(input: BusinessProfileInput): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        const { error } = await supabase
            .from("users")
            .update({
                business_name: input.business_name,
                business_type: input.business_type,
                dti_sec_number: input.dti_sec_number || null,
                business_address: input.business_address,
                contact_number: input.contact_number,
                rental_categories: input.rental_categories,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Error saving business profile:", error)
        return { success: false, error: "Failed to save business profile" }
    }
}

/**
 * Submit the business profile for admin verification review.
 * Only allowed if status is UNVERIFIED or REJECTED.
 */
export async function submitForVerification(input: BusinessProfileInput): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Not authenticated" }
        }

        // Check current status
        const { data: current } = await supabase
            .from("users")
            .select("verification_status")
            .eq("id", user.id)
            .single()

        if (current?.verification_status === "PENDING") {
            return { success: false, error: "Your verification is already pending review." }
        }

        if (current?.verification_status === "VERIFIED") {
            return { success: false, error: "Your business is already verified." }
        }

        if (!input.business_name?.trim()) {
            return { success: false, error: "Business name is required." }
        }

        if (!input.business_address?.trim()) {
            return { success: false, error: "Business address is required." }
        }

        if (!input.contact_number?.trim()) {
            return { success: false, error: "Contact number is required." }
        }

        if (!input.rental_categories || input.rental_categories.length === 0) {
            return { success: false, error: "Please select at least one rental category." }
        }

        const { error } = await supabase
            .from("users")
            .update({
                business_name: input.business_name,
                business_type: input.business_type,
                dti_sec_number: input.dti_sec_number || null,
                business_address: input.business_address,
                contact_number: input.contact_number,
                rental_categories: input.rental_categories,
                verification_status: "PENDING",
                verification_submitted_at: new Date().toISOString(),
                verification_reviewed_at: null,
                verification_notes: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Error submitting for verification:", error)
        return { success: false, error: "Failed to submit for verification" }
    }
}

/**
 * Admin: Get all pending verification requests.
 */
export async function getPendingVerifications(): Promise<{ success: boolean; users?: BusinessProfile[]; error?: string }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name, business_name, business_type, dti_sec_number, business_address, contact_number, verification_status, verification_submitted_at, verification_reviewed_at, verification_notes, rental_categories")
            .eq("verification_status", "PENDING")
            .order("verification_submitted_at", { ascending: true })

        if (error) {
            return { success: false, error: error.message }
        }

        return {
            success: true,
            users: (data || []).map(u => ({
                ...u,
                verification_status: (u.verification_status as VerificationStatus) || "UNVERIFIED",
                rental_categories: (u.rental_categories as string[]) || [],
            }))
        }
    } catch (error) {
        console.error("Error fetching pending verifications:", error)
        return { success: false, error: "Failed to fetch pending verifications" }
    }
}

/**
 * Admin: Approve or reject a business verification.
 */
export async function reviewVerification(
    userId: string,
    decision: "VERIFIED" | "REJECTED",
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("users")
            .update({
                verification_status: decision,
                verification_reviewed_at: new Date().toISOString(),
                verification_notes: notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error("Error reviewing verification:", error)
        return { success: false, error: "Failed to review verification" }
    }
}
