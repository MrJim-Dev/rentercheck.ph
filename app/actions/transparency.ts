"use server"

import { createClient } from "@/lib/supabase/server"

export interface TransparencyStats {
    // Report stats
    totalReports: number
    approvedReports: number
    pendingReports: number
    rejectedReports: number
    approvalRate: number

    // Dispute stats
    totalDisputes: number
    resolvedDisputes: number
    disputeResolutionRate: number

    // Category breakdown (top 5)
    topCategories: Array<{ category: string; label: string; count: number }>

    // Incident type breakdown (top 5)
    topIncidentTypes: Array<{ type: string; label: string; count: number }>

    // Platform growth
    totalRenters: number
    reportsThisMonth: number
    reportsLastMonth: number
    growthRate: number

    // Last updated
    generatedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
    CAMERA_EQUIPMENT: "Camera & Photography",
    CLOTHING_FASHION: "Clothing & Fashion",
    ELECTRONICS_GADGETS: "Electronics & Gadgets",
    VEHICLE_CAR: "Car Rental",
    VEHICLE_MOTORCYCLE: "Motorcycle Rental",
    VEHICLE_BICYCLE: "Bicycle / E-bike",
    REAL_ESTATE_CONDO: "Condo / Apartment",
    REAL_ESTATE_HOUSE: "House Rental",
    REAL_ESTATE_ROOM: "Room / Bedspace",
    FURNITURE_APPLIANCES: "Furniture & Appliances",
    EVENTS_PARTY: "Events & Party",
    TOOLS_EQUIPMENT: "Tools & Equipment",
    SPORTS_OUTDOOR: "Sports & Outdoor",
    JEWELRY_ACCESSORIES: "Jewelry & Accessories",
    BABY_KIDS: "Baby & Kids",
    OTHER: "Other",
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
    NON_RETURN: "Non-return of item",
    UNPAID_BALANCE: "Unpaid balance",
    LATE_PAYMENT: "Late payments",
    SCAM: "Scam / Fraud",
    DAMAGE_DISPUTE: "Damage dispute",
    PROPERTY_DAMAGE: "Property damage",
    CONTRACT_VIOLATION: "Contract violation",
    FAKE_INFO: "Fake info / Identity mismatch",
    NO_SHOW: "No-show / Ghosting",
    ABUSIVE_BEHAVIOR: "Abusive behavior",
    THREATS_HARASSMENT: "Threats / Harassment",
    OTHER: "Other",
}

export async function getTransparencyStats(): Promise<{ success: boolean; stats?: TransparencyStats; error?: string }> {
    try {
        const supabase = await createClient()

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

        // Fetch all approved/rejected/pending counts
        const { data: statusCounts } = await supabase
            .from("incident_reports")
            .select("status")

        const counts = (statusCounts || []).reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const totalReports = Object.values(counts).reduce((a, b) => a + b, 0)
        const approvedReports = counts["APPROVED"] || 0
        const pendingReports = (counts["PENDING"] || 0) + (counts["UNDER_REVIEW"] || 0)
        const rejectedReports = counts["REJECTED"] || 0
        const approvalRate = totalReports > 0 ? Math.round((approvedReports / (approvedReports + rejectedReports)) * 100) : 0

        // Disputes
        const { data: disputeData } = await supabase
            .from("disputes")
            .select("status")

        const disputeCounts = (disputeData || []).reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const totalDisputes = Object.values(disputeCounts).reduce((a, b) => a + b, 0)
        const resolvedDisputes = (disputeCounts["APPROVED"] || 0) + (disputeCounts["REJECTED"] || 0)
        const disputeResolutionRate = totalDisputes > 0 ? Math.round((resolvedDisputes / totalDisputes) * 100) : 0

        // Category breakdown (approved reports only)
        const { data: categoryData } = await supabase
            .from("incident_reports")
            .select("rental_category")
            .eq("status", "APPROVED")
            .not("rental_category", "is", null)

        const categoryCounts = (categoryData || []).reduce((acc, r) => {
            if (r.rental_category) {
                acc[r.rental_category] = (acc[r.rental_category] || 0) + 1
            }
            return acc
        }, {} as Record<string, number>)

        const topCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, count]) => ({
                category,
                label: CATEGORY_LABELS[category] || category,
                count,
            }))

        // Incident type breakdown (approved reports only)
        const { data: typeData } = await supabase
            .from("incident_reports")
            .select("incident_type")
            .eq("status", "APPROVED")
            .not("incident_type", "is", null)

        const typeCounts = (typeData || []).reduce((acc, r) => {
            if (r.incident_type) {
                acc[r.incident_type] = (acc[r.incident_type] || 0) + 1
            }
            return acc
        }, {} as Record<string, number>)

        const topIncidentTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({
                type,
                label: INCIDENT_TYPE_LABELS[type] || type,
                count,
            }))

        // Total unique renters
        const { count: totalRenters } = await supabase
            .from("renters")
            .select("*", { count: "exact", head: true })

        // Reports this month vs last month
        const { count: reportsThisMonth } = await supabase
            .from("incident_reports")
            .select("*", { count: "exact", head: true })
            .gte("submitted_at", startOfMonth)

        const { count: reportsLastMonth } = await supabase
            .from("incident_reports")
            .select("*", { count: "exact", head: true })
            .gte("submitted_at", startOfLastMonth)
            .lte("submitted_at", endOfLastMonth)

        const growthRate = (reportsLastMonth || 0) > 0
            ? Math.round((((reportsThisMonth || 0) - (reportsLastMonth || 0)) / (reportsLastMonth || 1)) * 100)
            : 0

        return {
            success: true,
            stats: {
                totalReports,
                approvedReports,
                pendingReports,
                rejectedReports,
                approvalRate,
                totalDisputes,
                resolvedDisputes,
                disputeResolutionRate,
                topCategories,
                topIncidentTypes,
                totalRenters: totalRenters || 0,
                reportsThisMonth: reportsThisMonth || 0,
                reportsLastMonth: reportsLastMonth || 0,
                growthRate,
                generatedAt: new Date().toISOString(),
            }
        }
    } catch (error) {
        console.error("Error fetching transparency stats:", error)
        return { success: false, error: "Failed to fetch transparency stats" }
    }
}
