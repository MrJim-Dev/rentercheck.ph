"use client"

import {
    getBusinessProfile,
    saveBusinessProfile,
    submitForVerification,
    type BusinessProfile,
    type BusinessProfileInput,
    type BusinessType,
} from "@/app/actions/business-profile"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth/auth-provider"
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    Info,
    Loader2,
    Lock,
    MapPin,
    Phone,
    RefreshCw,
    Shield,
    XCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
    { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship (DTI-registered)" },
    { value: "CORPORATION", label: "Corporation (SEC-registered)" },
    { value: "PARTNERSHIP", label: "Partnership (SEC-registered)" },
    { value: "COOPERATIVE", label: "Cooperative" },
    { value: "INDIVIDUAL", label: "Individual / Freelance Landlord" },
    { value: "OTHER", label: "Other" },
]

const RENTAL_CATEGORIES = [
    { value: "REAL_ESTATE_CONDO", label: "Condo / Apartment" },
    { value: "REAL_ESTATE_HOUSE", label: "House Rental" },
    { value: "REAL_ESTATE_ROOM", label: "Room / Bedspace" },
    { value: "VEHICLE_CAR", label: "Car Rental" },
    { value: "VEHICLE_MOTORCYCLE", label: "Motorcycle Rental" },
    { value: "VEHICLE_BICYCLE", label: "Bicycle / E-bike" },
    { value: "CAMERA_EQUIPMENT", label: "Camera & Photography" },
    { value: "ELECTRONICS_GADGETS", label: "Electronics & Gadgets" },
    { value: "CLOTHING_FASHION", label: "Clothing & Fashion" },
    { value: "FURNITURE_APPLIANCES", label: "Furniture & Appliances" },
    { value: "EVENTS_PARTY", label: "Events & Party" },
    { value: "TOOLS_EQUIPMENT", label: "Tools & Equipment" },
    { value: "SPORTS_OUTDOOR", label: "Sports & Outdoor" },
    { value: "JEWELRY_ACCESSORIES", label: "Jewelry & Accessories" },
    { value: "BABY_KIDS", label: "Baby & Kids" },
    { value: "OTHER", label: "Other" },
]

const STATUS_CONFIG = {
    UNVERIFIED: {
        label: "Not Verified",
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: AlertTriangle,
        desc: "Submit your business details to get verified.",
    },
    PENDING: {
        label: "Pending Review",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
        desc: "Your verification is under review. We'll notify you within 2-3 business days.",
    },
    VERIFIED: {
        label: "Verified Business",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle2,
        desc: "Your business has been verified. You have full access to all platform features.",
    },
    REJECTED: {
        label: "Verification Rejected",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
        desc: "Your verification was rejected. Please review the notes and resubmit.",
    },
}

export default function BusinessProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<BusinessProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Form state
    const [businessName, setBusinessName] = useState("")
    const [businessType, setBusinessType] = useState<BusinessType>("SOLE_PROPRIETORSHIP")
    const [dtiSecNumber, setDtiSecNumber] = useState("")
    const [businessAddress, setBusinessAddress] = useState("")
    const [contactNumber, setContactNumber] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const loadProfile = async () => {
        setIsLoading(true)
        try {
            const result = await getBusinessProfile()
            if (result.success && result.profile) {
                const p = result.profile
                setProfile(p)
                setBusinessName(p.business_name || "")
                setBusinessType((p.business_type as BusinessType) || "SOLE_PROPRIETORSHIP")
                setDtiSecNumber(p.dti_sec_number || "")
                setBusinessAddress(p.business_address || "")
                setContactNumber(p.contact_number || "")
                setSelectedCategories(p.rental_categories || [])
            }
        } catch {
            setError("Failed to load profile")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) loadProfile()
    }, [user])

    const getFormInput = (): BusinessProfileInput => ({
        business_name: businessName,
        business_type: businessType,
        dti_sec_number: dtiSecNumber || undefined,
        business_address: businessAddress,
        contact_number: contactNumber,
        rental_categories: selectedCategories,
    })

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccess(null)
        try {
            const result = await saveBusinessProfile(getFormInput())
            if (result.success) {
                setSuccess("Business profile saved successfully.")
                await loadProfile()
            } else {
                setError(result.error || "Failed to save profile")
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)
        setSuccess(null)
        try {
            const result = await submitForVerification(getFormInput())
            if (result.success) {
                setSuccess("Verification request submitted! We'll review your details within 2-3 business days.")
                await loadProfile()
            } else {
                setError(result.error || "Failed to submit verification")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleCategory = (value: string) => {
        setSelectedCategories(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        )
    }

    const isPending = profile?.verification_status === "PENDING"
    const isVerified = profile?.verification_status === "VERIFIED"
    const statusConfig = profile ? STATUS_CONFIG[profile.verification_status] : null

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader />

            <main className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2.5">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Business Profile</h1>
                            <p className="text-sm text-muted-foreground">
                                Verify your business to build trust and access all features
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadProfile} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {!user ? (
                    <div className="bg-card border-2 border-primary/20 rounded-xl p-8 text-center shadow-xl space-y-4">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                <Lock className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold">Sign In Required</h3>
                        <p className="text-muted-foreground">Please sign in to manage your business profile.</p>
                        <Button asChild size="lg">
                            <Link href="/login?returnTo=/profile">Sign In</Link>
                        </Button>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Verification Status Banner */}
                        {statusConfig && (
                            <div className={`border rounded-xl p-5 flex items-start gap-4 ${
                                isVerified ? "bg-green-50 border-green-200"
                                : isPending ? "bg-amber-50 border-amber-200"
                                : profile?.verification_status === "REJECTED" ? "bg-red-50 border-red-200"
                                : "bg-slate-50 border-slate-200"
                            }`}>
                                <div className={`rounded-full p-2 shrink-0 ${
                                    isVerified ? "bg-green-100" : isPending ? "bg-amber-100"
                                    : profile?.verification_status === "REJECTED" ? "bg-red-100" : "bg-slate-100"
                                }`}>
                                    <statusConfig.icon className={`h-5 w-5 ${
                                        isVerified ? "text-green-600" : isPending ? "text-amber-600"
                                        : profile?.verification_status === "REJECTED" ? "text-red-600" : "text-slate-600"
                                    }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                        {profile?.verification_submitted_at && (
                                            <span className="text-xs text-muted-foreground">
                                                Submitted {new Date(profile.verification_submitted_at).toLocaleDateString("en-PH")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm">{statusConfig.desc}</p>
                                    {profile?.verification_notes && (
                                        <div className="mt-2 p-3 bg-white/60 rounded-lg border text-sm">
                                            <strong>Admin Notes:</strong> {profile.verification_notes}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Why Verify Banner */}
                        {!isVerified && !isPending && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Why verify your business?</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>Verified badge on your reports — increases credibility</li>
                                        <li>Access to bulk import and advanced search features</li>
                                        <li>Higher trust score for your submitted reports</li>
                                        <li>Priority support from the RenterCheck team</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Business Profile Form */}
                        <div className="bg-background border rounded-xl p-6 shadow-sm space-y-5">
                            <h2 className="text-base font-semibold flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                Business Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="businessName">
                                        Business / Trade Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="businessName"
                                        placeholder="e.g. Juan's Car Rentals"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        disabled={isPending || isVerified}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="businessType">
                                        Business Type <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        id="businessType"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        value={businessType}
                                        onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                                        disabled={isPending || isVerified}
                                    >
                                        {BUSINESS_TYPES.map(bt => (
                                            <option key={bt.value} value={bt.value}>{bt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dtiSecNumber">
                                        DTI / SEC Registration No.
                                        <span className="text-muted-foreground text-xs ml-1">(optional but recommended)</span>
                                    </Label>
                                    <Input
                                        id="dtiSecNumber"
                                        placeholder="e.g. DTI-1234567 or SEC-CS12345"
                                        value={dtiSecNumber}
                                        onChange={(e) => setDtiSecNumber(e.target.value)}
                                        disabled={isPending || isVerified}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="businessAddress" className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        Business Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="businessAddress"
                                        placeholder="e.g. 123 Rizal St., Makati City, Metro Manila"
                                        value={businessAddress}
                                        onChange={(e) => setBusinessAddress(e.target.value)}
                                        disabled={isPending || isVerified}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactNumber" className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        Contact Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contactNumber"
                                        type="tel"
                                        placeholder="e.g. 09123456789"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        disabled={isPending || isVerified}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label>
                                    Rental Categories <span className="text-red-500">*</span>
                                    <span className="text-muted-foreground text-xs ml-1">Select all that apply</span>
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {RENTAL_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => !isPending && !isVerified && toggleCategory(cat.value)}
                                            disabled={isPending || isVerified}
                                            className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                                                selectedCategories.includes(cat.value)
                                                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                                                    : "bg-background border-input text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                            } ${isPending || isVerified ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* DTI Verification Note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
                                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <strong>Manual Verification Process:</strong> Our team will verify your DTI/SEC number
                                    via the{" "}
                                    <a
                                        href="https://bnrs.dti.gov.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-amber-900 inline-flex items-center gap-1"
                                    >
                                        DTI BNRS portal <ExternalLink className="h-3 w-3" />
                                    </a>{" "}
                                    or{" "}
                                    <a
                                        href="https://www.sec.gov.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-amber-900 inline-flex items-center gap-1"
                                    >
                                        SEC website <ExternalLink className="h-3 w-3" />
                                    </a>
                                    . This typically takes 2–3 business days.
                                </div>
                            </div>

                            {/* Feedback messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                    {success}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!isPending && !isVerified && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1"
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                                        ) : "Save Draft"}
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4 mr-2" />
                                                Submit for Verification
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {isPending && (
                                <div className="text-center text-sm text-muted-foreground pt-2">
                                    Your verification is under review. You will be notified by email once it is processed.
                                </div>
                            )}

                            {isVerified && (
                                <div className="text-center text-sm text-green-700 pt-2 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Your business is verified. Contact support to update your details.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
