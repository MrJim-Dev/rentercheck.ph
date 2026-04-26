"use client"

import { submitIncidentReport } from "@/app/actions/report"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth/auth-provider"
import { AlertTriangle, CheckCircle, FileWarning, Loader2, LogIn, Zap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const INCIDENT_TYPES = [
    { value: "NON_RETURN", label: "Non-return of item/unit", category: "Transaction" },
    { value: "UNPAID_BALANCE", label: "Unpaid balance", category: "Transaction" },
    { value: "LATE_PAYMENT", label: "Consistently late payments", category: "Transaction" },
    { value: "SCAM", label: "Scam / Fraudulent transaction", category: "Transaction" },
    { value: "DAMAGE_DISPUTE", label: "Damage to item/property", category: "Property" },
    { value: "PROPERTY_DAMAGE", label: "Intentional property damage", category: "Property" },
    { value: "CONTRACT_VIOLATION", label: "Violated rental agreement", category: "Property" },
    { value: "FAKE_INFO", label: "Fake info / Identity mismatch", category: "Trust" },
    { value: "NO_SHOW", label: "No-show / Ghosting", category: "Trust" },
    { value: "ABUSIVE_BEHAVIOR", label: "Rude / Abusive behavior", category: "Behavior" },
    { value: "THREATS_HARASSMENT", label: "Threats / Harassment", category: "Behavior" },
    { value: "OTHER", label: "Other issue", category: "Other" },
] as const

const RENTAL_CATEGORIES = [
    { value: "CAMERA_EQUIPMENT", label: "Camera & Photography" },
    { value: "CLOTHING_FASHION", label: "Clothing & Fashion" },
    { value: "ELECTRONICS_GADGETS", label: "Electronics & Gadgets" },
    { value: "VEHICLE_CAR", label: "Car" },
    { value: "VEHICLE_MOTORCYCLE", label: "Motorcycle" },
    { value: "VEHICLE_BICYCLE", label: "Bicycle / E-bike" },
    { value: "REAL_ESTATE_CONDO", label: "Condo / Apartment" },
    { value: "REAL_ESTATE_HOUSE", label: "House" },
    { value: "REAL_ESTATE_ROOM", label: "Room / Bedspace" },
    { value: "FURNITURE_APPLIANCES", label: "Furniture & Appliances" },
    { value: "EVENTS_PARTY", label: "Events & Party" },
    { value: "TOOLS_EQUIPMENT", label: "Tools & Equipment" },
    { value: "SPORTS_OUTDOOR", label: "Sports & Outdoor" },
    { value: "JEWELRY_ACCESSORIES", label: "Jewelry & Accessories" },
    { value: "BABY_KIDS", label: "Baby & Kids" },
    { value: "OTHER", label: "Other" },
] as const

const quickReportSchema = z.object({
    fullName: z.string().min(2, "Full name is required (at least 2 characters)"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    rentalCategory: z.string().min(1, "Please select a rental category"),
    incidentType: z.string().min(1, "Please select an incident type"),
    incidentDate: z.string().min(1, "Incident date is required"),
    summary: z.string().min(20, "Please provide at least 20 characters describing the incident"),
    confirmTruth: z.boolean().refine(v => v === true, "You must confirm the information is true"),
    confirmBan: z.boolean().refine(v => v === true, "You must confirm you understand the terms"),
}).refine(
    (data) => data.phone || data.email,
    {
        message: "At least one identifier is required: phone number or email",
        path: ["phone"],
    }
)

type QuickReportFormData = z.infer<typeof quickReportSchema>

function QuickReportContent() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [submittedReportId, setSubmittedReportId] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<QuickReportFormData>({
        resolver: zodResolver(quickReportSchema),
        defaultValues: {
            confirmTruth: false,
            confirmBan: false,
        },
    })

    const confirmTruth = watch("confirmTruth")
    const confirmBan = watch("confirmBan")

    const onSubmit = async (data: QuickReportFormData) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const result = await submitIncidentReport({
                fullName: data.fullName,
                phone: data.phone || undefined,
                email: data.email || undefined,
                rentalCategory: data.rentalCategory as any,
                incidentType: data.incidentType as any,
                incidentDate: data.incidentDate,
                summary: data.summary,
                confirmTruth: data.confirmTruth,
                confirmBan: data.confirmBan,
            })

            if (result.success && result.data) {
                setSubmitSuccess(true)
                setSubmittedReportId(result.data.reportId)
            } else {
                setSubmitError(result.error || "Failed to submit report. Please try again.")
            }
        } catch (err) {
            setSubmitError("An unexpected error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader currentPage="report" />
                <main className="container mx-auto px-4 md:px-6 py-16">
                    <div className="max-w-md mx-auto text-center space-y-6">
                        <div className="rounded-full bg-primary/10 p-5 inline-flex">
                            <LogIn className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Sign In Required</h2>
                        <p className="text-muted-foreground">
                            You need to be signed in as a verified business to submit incident reports.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button asChild size="lg">
                                <Link href="/login?returnTo=/report/quick">Sign In</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/signup?returnTo=/report/quick">Create Account</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader currentPage="report" />
                <main className="container mx-auto px-4 md:px-6 py-16">
                    <div className="max-w-md mx-auto text-center space-y-6">
                        <div className="rounded-full bg-green-100 p-5 inline-flex">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Report Submitted!</h2>
                        <p className="text-muted-foreground">
                            Your quick report has been submitted and is pending admin review. You can add more details and evidence from your dashboard.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                            <p className="text-sm font-medium text-amber-900">Want to strengthen your report?</p>
                            <p className="text-sm text-amber-800 mt-1">
                                Adding evidence (rental agreement, payment proof, screenshots) increases your report's quality score and makes it more credible.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {submittedReportId && (
                                <Button asChild>
                                    <Link href={`/report?id=${submittedReportId}`}>Add Evidence & Details</Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader currentPage="report" />
            <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-sm font-medium mb-4">
                            <Zap className="w-4 h-4" />
                            Quick Report
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                            Report a Renter Incident
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Fill in the essentials now. You can add evidence and more details later from your dashboard.
                        </p>
                    </div>

                    {/* Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 mb-6">
                        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <strong>Quick reports are reviewed before publishing.</strong> Adding evidence (rental agreement, screenshots, payment proof) will speed up approval and increase your report's credibility score.
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Renter Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="fullName">
                                Renter's Full Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="e.g. Juan Dela Cruz"
                                {...register("fullName")}
                                className={errors.fullName ? "border-destructive" : ""}
                            />
                            {errors.fullName && (
                                <p className="text-xs text-destructive">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Contact Identifiers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">
                                    Phone Number <span className="text-muted-foreground text-xs">(recommended)</span>
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="+63 917 123 4567"
                                    {...register("phone")}
                                    className={errors.phone ? "border-destructive" : ""}
                                />
                                {errors.phone && (
                                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="renter@email.com"
                                    {...register("email")}
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            At least one identifier (phone or email) is required for matching.
                        </p>

                        {/* Rental Category */}
                        <div className="space-y-1.5">
                            <Label>
                                Rental Category <span className="text-destructive">*</span>
                            </Label>
                            <Select onValueChange={(v) => setValue("rentalCategory", v)}>
                                <SelectTrigger className={errors.rentalCategory ? "border-destructive" : ""}>
                                    <SelectValue placeholder="What type of rental?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RENTAL_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.rentalCategory && (
                                <p className="text-xs text-destructive">{errors.rentalCategory.message}</p>
                            )}
                        </div>

                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <Label>
                                Incident Type <span className="text-destructive">*</span>
                            </Label>
                            <Select onValueChange={(v) => setValue("incidentType", v)}>
                                <SelectTrigger className={errors.incidentType ? "border-destructive" : ""}>
                                    <SelectValue placeholder="What happened?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["Transaction", "Property", "Trust", "Behavior", "Other"].map((category) => (
                                        <div key={category}>
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                {category}
                                            </div>
                                            {INCIDENT_TYPES.filter(t => t.category === category).map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.incidentType && (
                                <p className="text-xs text-destructive">{errors.incidentType.message}</p>
                            )}
                        </div>

                        {/* Incident Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="incidentDate">
                                Incident Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="incidentDate"
                                type="date"
                                max={new Date().toISOString().split("T")[0]}
                                {...register("incidentDate")}
                                className={errors.incidentDate ? "border-destructive" : ""}
                            />
                            {errors.incidentDate && (
                                <p className="text-xs text-destructive">{errors.incidentDate.message}</p>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="space-y-1.5">
                            <Label htmlFor="summary">
                                Brief Description <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="summary"
                                placeholder="Briefly describe what happened. Be factual and objective. Avoid personal attacks or inflammatory language."
                                rows={4}
                                {...register("summary")}
                                className={errors.summary ? "border-destructive" : ""}
                            />
                            {errors.summary && (
                                <p className="text-xs text-destructive">{errors.summary.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Stick to facts. Avoid names of third parties, personal insults, or unverified claims.
                            </p>
                        </div>

                        {/* Confirmations */}
                        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="confirmTruth"
                                    checked={confirmTruth}
                                    onCheckedChange={(v) => setValue("confirmTruth", !!v)}
                                    className={errors.confirmTruth ? "border-destructive" : ""}
                                />
                                <Label htmlFor="confirmTruth" className="text-sm font-normal leading-relaxed cursor-pointer">
                                    I confirm that the information I am submitting is truthful and based on my direct experience as a rental business owner.
                                </Label>
                            </div>
                            {errors.confirmTruth && (
                                <p className="text-xs text-destructive ml-7">{errors.confirmTruth.message}</p>
                            )}
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="confirmBan"
                                    checked={confirmBan}
                                    onCheckedChange={(v) => setValue("confirmBan", !!v)}
                                    className={errors.confirmBan ? "border-destructive" : ""}
                                />
                                <Label htmlFor="confirmBan" className="text-sm font-normal leading-relaxed cursor-pointer">
                                    I understand that submitting false or malicious reports may result in account suspension and potential legal liability.
                                </Label>
                            </div>
                            {errors.confirmBan && (
                                <p className="text-xs text-destructive ml-7">{errors.confirmBan.message}</p>
                            )}
                        </div>

                        {/* Submit Error */}
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                                {submitError}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4 mr-2" />
                                        Submit Quick Report
                                    </>
                                )}
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <Link href="/report">
                                    <FileWarning className="h-4 w-4 mr-2" />
                                    Full Report Form
                                </Link>
                            </Button>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Need to add evidence, aliases, or location details?{" "}
                            <Link href="/report" className="underline hover:text-foreground">
                                Use the full report form
                            </Link>
                            .
                        </p>
                    </form>
                </div>
            </main>
        </div>
    )
}

export default function QuickReportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <QuickReportContent />
        </Suspense>
    )
}
