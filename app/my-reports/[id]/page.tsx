"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AppHeader } from "@/components/shared/app-header"
import { MultiInput } from "@/components/ui/multi-input"
import { 
    getReportById, 
    getEvidenceUrl, 
    createAmendment, 
    uploadAmendmentEvidence,
    deleteAmendment,
    type AmendmentFormData 
} from "@/app/actions/report"
import type { Database, Enums } from "@/lib/database.types"
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Facebook,
    User,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    MessageSquare,
    ExternalLink,
    ImageIcon,
    FileIcon,
    Loader2,
    DollarSign,
    Home,
    Cake,
    Plus,
    Upload,
    X,
    ChevronDown,
    ChevronUp,
    PenLine,
    Trash2,
} from "lucide-react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]
type Evidence = Database["public"]["Tables"]["report_evidence"]["Row"]
type InfoRequest = Database["public"]["Tables"]["report_info_requests"]["Row"]
type Amendment = Database["public"]["Tables"]["report_amendments"]["Row"]

const AMENDMENT_TYPE_LABELS: Record<string, { label: string; description: string; icon: string }> = {
    ADDITIONAL_INFO: { 
        label: "Additional Information", 
        description: "Add more details to your report",
        icon: "📝" 
    },
    NEW_EVIDENCE: { 
        label: "New Evidence", 
        description: "Upload additional proof or documents",
        icon: "📎" 
    },
    CORRECTION: { 
        label: "Correction", 
        description: "Fix an error in your report",
        icon: "✏️" 
    },
    NEW_IDENTIFIER: { 
        label: "New Contact Info", 
        description: "Add phone, email, or social media",
        icon: "📱" 
    },
}

const AMENDMENT_STATUS_CONFIG = {
    PENDING: {
        label: "Pending Review",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Clock,
    },
    APPROVED: {
        label: "Approved",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Rejected",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: XCircle,
    },
}

const STATUS_CONFIG = {
    DRAFT: {
        label: "Draft",
        color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
        icon: FileText,
        description: "This report has not been submitted yet.",
    },
    PENDING: {
        label: "Pending Review",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Clock,
        description: "Your report is in the queue and will be reviewed within 24-48 hours.",
    },
    UNDER_REVIEW: {
        label: "Under Review",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: Eye,
        description: "An admin is currently reviewing your report.",
    },
    APPROVED: {
        label: "Approved",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: CheckCircle2,
        description: "Your report has been verified and published.",
    },
    REJECTED: {
        label: "Rejected",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: XCircle,
        description: "Your report did not meet our verification standards.",
    },
    DISPUTED: {
        label: "Disputed",
        color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        icon: AlertTriangle,
        description: "This report is being contested and under investigation.",
    },
    RESOLVED: {
        label: "Resolved",
        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        icon: CheckCircle2,
        description: "The dispute has been resolved.",
    },
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
    NON_RETURN: "Non-return of Item/Unit",
    UNPAID_BALANCE: "Unpaid Balance",
    DAMAGE_DISPUTE: "Property Damage / Dispute",
    FAKE_INFO: "Fake Info / Identity Mismatch",
    THREATS_HARASSMENT: "Threats / Harassment",
    NON_PAYMENT: "Non-payment",
    PROPERTY_DAMAGE: "Property Damage",
    LEASE_VIOLATION: "Lease Violation",
    ILLEGAL_ACTIVITY: "Illegal Activity",
    OTHER: "Other",
}

const RENTAL_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    CAMERA_EQUIPMENT: { label: "Camera & Photography", icon: "📷" },
    CLOTHING_FASHION: { label: "Clothing & Fashion", icon: "👗" },
    ELECTRONICS_GADGETS: { label: "Electronics & Gadgets", icon: "📱" },
    VEHICLE_CAR: { label: "Car", icon: "🚗" },
    VEHICLE_MOTORCYCLE: { label: "Motorcycle", icon: "🏍️" },
    VEHICLE_BICYCLE: { label: "Bicycle / E-bike", icon: "🚲" },
    REAL_ESTATE_CONDO: { label: "Condo / Apartment", icon: "🏢" },
    REAL_ESTATE_HOUSE: { label: "House", icon: "🏠" },
    REAL_ESTATE_ROOM: { label: "Room / Bedspace", icon: "🛏️" },
    FURNITURE_APPLIANCES: { label: "Furniture & Appliances", icon: "🪑" },
    EVENTS_PARTY: { label: "Events & Party", icon: "🎉" },
    TOOLS_EQUIPMENT: { label: "Tools & Equipment", icon: "🔧" },
    SPORTS_OUTDOOR: { label: "Sports & Outdoor", icon: "⚽" },
    JEWELRY_ACCESSORIES: { label: "Jewelry & Accessories", icon: "💍" },
    BABY_KIDS: { label: "Baby & Kids", icon: "🧸" },
    OTHER: { label: "Other", icon: "📦" },
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
    RENTAL_AGREEMENT: "Rental Agreement",
    PAYMENT_PROOF: "Proof of Payment",
    CONVERSATION: "Conversation",
    ITEM_PHOTO: "Item/Unit Photo",
    ID_PROOF: "ID Proof",
    RENTER_PHOTO: "Renter Photo",
    OTHER: "Other",
}

export default function ReportDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const reportId = params.id as string
    const shouldOpenEdit = searchParams.get("action") === "edit"

    const [report, setReport] = useState<Report | null>(null)
    const [evidence, setEvidence] = useState<Evidence[]>([])
    const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([])
    const [amendments, setAmendments] = useState<Amendment[]>([])
    const [amendmentEvidence, setAmendmentEvidence] = useState<Record<string, Evidence[]>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loadingEvidence, setLoadingEvidence] = useState<string | null>(null)

    // Amendment form state
    const [showAmendmentForm, setShowAmendmentForm] = useState(false)
    const [amendmentType, setAmendmentType] = useState<Enums<"amendment_type"> | "">("")
    const [amendmentNotes, setAmendmentNotes] = useState("")
    const [amendmentChanges, setAmendmentChanges] = useState<AmendmentFormData["changes"]>({})
    const [amendmentFiles, setAmendmentFiles] = useState<File[]>([])
    const [isSubmittingAmendment, setIsSubmittingAmendment] = useState(false)
    const [amendmentError, setAmendmentError] = useState<string | null>(null)
    const [deletingAmendmentId, setDeletingAmendmentId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Multiple identifiers for NEW_IDENTIFIER amendment
    const [newPhones, setNewPhones] = useState<string[]>([])
    const [newEmails, setNewEmails] = useState<string[]>([])
    const [newFacebooks, setNewFacebooks] = useState<string[]>([])

    // Phone normalization helper
    const normalizePhone = (value: string) => {
        let cleaned = value.replace(/[^\d+]/g, "")
        if (cleaned.startsWith("0")) {
            cleaned = "+63" + cleaned.slice(1)
        } else if (cleaned.startsWith("63") && !cleaned.startsWith("+63")) {
            cleaned = "+" + cleaned
        } else if (cleaned.match(/^9\d{9}$/)) {
            cleaned = "+63" + cleaned
        }
        return cleaned
    }

    // Validation helpers
    const validatePhone = (value: string) => {
        const digits = value.replace(/\D/g, "")
        return digits.length >= 7
    }

    const validateEmail = (value: string) => {
        return value.includes("@") && value.includes(".") && value.length >= 5
    }

    // Facebook link normalization
    const normalizeFacebookLink = (value: string) => {
        if (!value.trim()) return ""
        if (value.includes("facebook.com") || value.includes("fb.com")) {
            if (!value.startsWith("http")) {
                return "https://" + value
            }
            return value
        }
        if (value.match(/^[a-zA-Z0-9.]+$/)) {
            return `https://facebook.com/${value}`
        }
        return value
    }

    const fetchReport = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const result = await getReportById(reportId)

        if (result.success && result.data) {
            setReport(result.data.report)
            setEvidence(result.data.evidence)
            setInfoRequests(result.data.infoRequests)
            setAmendments(result.data.amendments)
            setAmendmentEvidence(result.data.amendmentEvidence)
        } else {
            setError(result.error || "Failed to load report")
        }

        setIsLoading(false)
    }, [reportId])

    useEffect(() => {
        if (reportId) {
            fetchReport()
        }
    }, [reportId, fetchReport])

    // Auto-expand amendment form when ?action=edit
    useEffect(() => {
        if (shouldOpenEdit && report && !showAmendmentForm) {
            setShowAmendmentForm(true)
            // Scroll to the amendment section
            setTimeout(() => {
                document.getElementById("amendments-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 100)
        }
    }, [shouldOpenEdit, report])

    const handleViewEvidence = async (ev: Evidence) => {
        setLoadingEvidence(ev.id)
        try {
            const result = await getEvidenceUrl(ev.storage_path)
            if (result.success && result.data) {
                window.open(result.data.url, "_blank")
            }
        } catch (err) {
            console.error("Failed to get evidence URL:", err)
        }
        setLoadingEvidence(null)
    }

    const resetAmendmentForm = () => {
        setAmendmentType("")
        setAmendmentNotes("")
        setAmendmentChanges({})
        setAmendmentFiles([])
        setAmendmentError(null)
        setShowAmendmentForm(false)
        // Reset multiple identifiers
        setNewPhones([])
        setNewEmails([])
        setNewFacebooks([])
    }

    const handleSubmitAmendment = async () => {
        if (!amendmentType) {
            setAmendmentError("Please select what type of information you're adding")
            return
        }

        // For NEW_EVIDENCE, require at least one file
        if (amendmentType === "NEW_EVIDENCE" && amendmentFiles.length === 0) {
            setAmendmentError("Please upload at least one file")
            return
        }

        // For ADDITIONAL_INFO or CORRECTION, require some text
        if ((amendmentType === "ADDITIONAL_INFO" || amendmentType === "CORRECTION") && 
            !amendmentChanges.additionalNotes?.trim()) {
            setAmendmentError("Please provide the additional information or correction")
            return
        }

        // For NEW_IDENTIFIER, require at least one identifier
        if (amendmentType === "NEW_IDENTIFIER" &&
            newPhones.length === 0 && newEmails.length === 0 && newFacebooks.length === 0) {
            setAmendmentError("Please provide at least one contact identifier")
            return
        }

        setIsSubmittingAmendment(true)
        setAmendmentError(null)

        try {
            // Prepare changes with multiple identifiers for NEW_IDENTIFIER type
            const changes = amendmentType === "NEW_IDENTIFIER" 
                ? {
                    ...amendmentChanges,
                    phones: newPhones.length > 0 ? newPhones : undefined,
                    emails: newEmails.length > 0 ? newEmails : undefined,
                    facebookLinks: newFacebooks.length > 0 ? newFacebooks : undefined,
                    // Also set single values for backwards compatibility
                    phone: newPhones[0] || undefined,
                    email: newEmails[0] || undefined,
                    facebookLink: newFacebooks[0] || undefined,
                }
                : amendmentChanges

            // Create the amendment
            const result = await createAmendment({
                reportId,
                amendmentType: amendmentType as Enums<"amendment_type">,
                changes,
                reporterNotes: amendmentNotes || undefined,
            })

            if (!result.success || !result.data) {
                setAmendmentError(result.error || "Failed to create amendment")
                setIsSubmittingAmendment(false)
                return
            }

            const amendmentId = result.data.amendmentId

            // Upload files if any
            if (amendmentFiles.length > 0) {
                for (const file of amendmentFiles) {
                    const uploadResult = await uploadAmendmentEvidence(
                        reportId,
                        amendmentId,
                        "OTHER", // Default type for amendment evidence
                        file
                    )
                    if (!uploadResult.success) {
                        console.error("Failed to upload file:", uploadResult.error)
                    }
                }
            }

            // Refresh the report data
            await fetchReport()
            resetAmendmentForm()
        } catch (err) {
            console.error("Error submitting amendment:", err)
            setAmendmentError("An unexpected error occurred")
        } finally {
            setIsSubmittingAmendment(false)
        }
    }

    const handleDeleteAmendment = async (amendmentId: string) => {
        setDeletingAmendmentId(amendmentId)
        try {
            const result = await deleteAmendment(amendmentId)
            if (result.success) {
                await fetchReport()
            } else {
                alert(result.error || "Failed to delete amendment")
            }
        } catch (err) {
            console.error("Error deleting amendment:", err)
        } finally {
            setDeletingAmendmentId(null)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAmendmentFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setAmendmentFiles(prev => prev.filter((_, i) => i !== index))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader currentPage="my-reports" />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader currentPage="my-reports" />
                <main className="container mx-auto px-4 md:px-6 py-8">
                    <div className="max-w-2xl mx-auto text-center py-16">
                        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
                        <p className="text-muted-foreground mb-6">{error || "This report does not exist or you don't have access to it."}</p>
                        <Link href="/my-reports">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to My Reports
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    const status = report.status || "PENDING"
    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
    const StatusIcon = statusConfig.icon
    const pendingInfoRequests = infoRequests.filter(r => !r.is_resolved)

    return (
        <div className="min-h-screen bg-background">
            <AppHeader currentPage="my-reports" />

            <main className="container mx-auto px-4 md:px-6 py-8">
                {/* Back Button & Header */}
                <div className="mb-8">
                    <Link href="/my-reports" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Reports
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Report Details</h1>
                            <p className="text-sm text-muted-foreground font-mono">
                                ID: {report.id}
                            </p>
                        </div>
                        <Badge className={`${statusConfig.color} border text-sm px-4 py-1.5 gap-2 self-start`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                        </Badge>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className={`rounded-xl border p-5 ${statusConfig.color.replace("text-", "border-").split(" ")[2]}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${statusConfig.color}`}>
                                    <StatusIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">{statusConfig.label}</h3>
                                    <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
                                </div>
                                {/* Quick Add Details Button */}
                                {!showAmendmentForm && (
                                    <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => {
                                            setShowAmendmentForm(true)
                                            setTimeout(() => {
                                                document.getElementById("amendments-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
                                            }, 100)
                                        }}
                                        className="gap-2 shrink-0"
                                    >
                                        <PenLine className="w-4 h-4" />
                                        <span className="hidden sm:inline">Add Details</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Info Requests Alert */}
                        {pendingInfoRequests.length > 0 && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                                <div className="flex items-start gap-4">
                                    <MessageSquare className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-amber-300 mb-1">Action Required</h3>
                                        <p className="text-sm text-amber-200/70 mb-4">
                                            Admin has requested additional information. Please respond to help verify your report.
                                        </p>
                                        {pendingInfoRequests.map((req) => (
                                            <div key={req.id} className="bg-amber-900/20 rounded-lg p-4 mb-2">
                                                <p className="text-sm text-amber-100">{req.request_message}</p>
                                                <p className="text-xs text-amber-200/50 mt-2">
                                                    Requested: {new Date(req.created_at || "").toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                        <Button size="sm" className="mt-2 bg-amber-500 hover:bg-amber-600 text-amber-950">
                                            Respond Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reported Person */}
                        <div className="bg-card border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Reported Person
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-2xl font-bold">{report.reported_full_name}</p>
                                    {/* Show aliases if any */}
                                    {(() => {
                                        const aliases = (report as unknown as { reported_aliases?: string[] }).reported_aliases;
                                        if (aliases && aliases.length > 0) {
                                            return (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">Also known as:</span>
                                                    {aliases.map((alias: string, idx: number) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {alias}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Phone Numbers (show all from JSONB array or fallback to single) */}
                                    {(() => {
                                        const phones = (report as unknown as { reported_phones?: string[] }).reported_phones || 
                                            (report.reported_phone ? [report.reported_phone] : []);
                                        if (phones.length === 0) return null;
                                        return (
                                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-muted-foreground">
                                                        Phone{phones.length > 1 ? ` (${phones.length})` : ""}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {phones.map((phone: string, idx: number) => (
                                                            <p key={idx} className="text-sm font-medium">{phone}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* Email Addresses (show all from JSONB array or fallback to single) */}
                                    {(() => {
                                        const emails = (report as unknown as { reported_emails?: string[] }).reported_emails || 
                                            (report.reported_email ? [report.reported_email] : []);
                                        if (emails.length === 0) return null;
                                        return (
                                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-muted-foreground">
                                                        Email{emails.length > 1 ? ` (${emails.length})` : ""}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {emails.map((email: string, idx: number) => (
                                                            <p key={idx} className="text-sm font-medium truncate">{email}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* Facebook Profiles (show all from JSONB array or fallback to single) */}
                                    {(() => {
                                        const facebooks = (report as unknown as { reported_facebooks?: string[] }).reported_facebooks || 
                                            (report.reported_facebook ? [report.reported_facebook] : []);
                                        if (facebooks.length === 0) return null;
                                        return (
                                            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                <Facebook className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-muted-foreground">
                                                        Facebook{facebooks.length > 1 ? ` (${facebooks.length})` : ""}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {facebooks.map((fb: string, idx: number) => (
                                                            <p key={idx} className="text-sm font-medium truncate">{fb}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {report.reported_date_of_birth && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                            <Cake className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Date of Birth</p>
                                                <p className="text-sm font-medium">{new Date(report.reported_date_of_birth).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(report.reported_address || report.reported_city) && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg sm:col-span-2">
                                            <Home className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Address</p>
                                                <p className="text-sm font-medium">
                                                    {[report.reported_address, report.reported_city].filter(Boolean).join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rental Item Details */}
                        {(report.rental_category || report.rental_item_description) && (
                            <div className="bg-card border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span className="text-xl">🏷️</span>
                                    Rented Item
                                </h2>

                                <div className="flex flex-wrap gap-3">
                                    {report.rental_category && (
                                        <Badge variant="secondary" className="text-sm gap-1.5">
                                            <span>{RENTAL_CATEGORY_LABELS[report.rental_category]?.icon || "📦"}</span>
                                            {RENTAL_CATEGORY_LABELS[report.rental_category]?.label || report.rental_category}
                                        </Badge>
                                    )}
                                    {report.rental_item_description && (
                                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                            <p className="text-sm font-medium">{report.rental_item_description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Incident Details */}
                        <div className="bg-card border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                                Incident Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <Badge variant="secondary" className="text-sm">
                                        {INCIDENT_TYPE_LABELS[report.incident_type] || report.incident_type}
                                    </Badge>
                                    {report.amount_involved && (
                                        <Badge variant="outline" className="text-sm gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            ₱{report.amount_involved.toLocaleString()}
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Incident Date</p>
                                            <p className="text-sm font-medium">
                                                {report.incident_date ? new Date(report.incident_date).toLocaleDateString() : "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    {(report.incident_region || report.incident_city || report.incident_place) && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Location</p>
                                                <p className="text-sm font-medium">
                                                    {[report.incident_place, report.incident_city, report.incident_region].filter(Boolean).join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-2">Summary</p>
                                    <p className="text-sm leading-relaxed">{report.summary}</p>
                                </div>
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="bg-card border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                Evidence Files
                                <span className="text-sm font-normal text-muted-foreground">({evidence.length})</span>
                            </h2>

                            {evidence.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No evidence files uploaded
                                </p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {evidence.map((ev) => {
                                        const isImage = ev.mime_type?.startsWith("image/")
                                        return (
                                            <div
                                                key={ev.id}
                                                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    {isImage ? (
                                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                    ) : (
                                                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{ev.file_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {EVIDENCE_TYPE_LABELS[ev.evidence_type] || ev.evidence_type}
                                                        {ev.file_size && ` • ${(ev.file_size / 1024).toFixed(1)} KB`}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="shrink-0 opacity-0 group-hover:opacity-100"
                                                    onClick={() => handleViewEvidence(ev)}
                                                    disabled={loadingEvidence === ev.id}
                                                >
                                                    {loadingEvidence === ev.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <ExternalLink className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Amendments Section */}
                        <div id="amendments-section" className="bg-card border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <PenLine className="w-5 h-5 text-muted-foreground" />
                                    Updates & Amendments
                                    {amendments.length > 0 && (
                                        <span className="text-sm font-normal text-muted-foreground">({amendments.length})</span>
                                    )}
                                </h2>
                                {!showAmendmentForm && (
                                    <Button 
                                        size="sm" 
                                        className="gap-2 bg-secondary hover:bg-secondary/90"
                                        onClick={() => setShowAmendmentForm(true)}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add More Details
                                    </Button>
                                )}
                            </div>

                            {/* Amendment Form */}
                            {showAmendmentForm && (
                                <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-dashed space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">Add New Information</h3>
                                        <Button size="sm" variant="ghost" onClick={resetAmendmentForm}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Amendment Type Selection */}
                                    <div className="space-y-2">
                                        <Label>What would you like to add?</Label>
                                        <div className="grid sm:grid-cols-2 gap-2">
                                            {Object.entries(AMENDMENT_TYPE_LABELS).map(([type, config]) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setAmendmentType(type as Enums<"amendment_type">)}
                                                    className={`p-3 rounded-lg border text-left transition-colors ${
                                                        amendmentType === type
                                                            ? "border-secondary bg-secondary/10"
                                                            : "border-border hover:border-secondary/50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{config.icon}</span>
                                                        <span className="text-sm font-medium">{config.label}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Dynamic Form Fields based on type */}
                                    {amendmentType === "ADDITIONAL_INFO" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="additionalInfo">Additional Information</Label>
                                            <Textarea
                                                id="additionalInfo"
                                                placeholder="Provide any additional details that would help verify this report..."
                                                value={amendmentChanges.additionalNotes || ""}
                                                onChange={(e) => setAmendmentChanges(prev => ({ ...prev, additionalNotes: e.target.value }))}
                                                rows={4}
                                            />
                                        </div>
                                    )}

                                    {amendmentType === "CORRECTION" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="correction">What needs to be corrected?</Label>
                                            <Textarea
                                                id="correction"
                                                placeholder="Explain what information was incorrect and what the correct information is..."
                                                value={amendmentChanges.additionalNotes || ""}
                                                onChange={(e) => setAmendmentChanges(prev => ({ ...prev, additionalNotes: e.target.value }))}
                                                rows={4}
                                            />
                                        </div>
                                    )}

                                    {amendmentType === "NEW_IDENTIFIER" && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-muted-foreground">
                                                Add new contact identifiers. You can add multiple values for each type.
                                            </p>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                                    Phone Number{newPhones.length > 1 ? "s" : ""}
                                                </Label>
                                                <MultiInput
                                                    values={newPhones}
                                                    onChange={setNewPhones}
                                                    placeholder="09XX XXX XXXX"
                                                    maxItems={5}
                                                    icon={<Phone className="w-4 h-4" />}
                                                    validateFn={validatePhone}
                                                    normalizeFn={normalizePhone}
                                                    addLabel="Add another phone"
                                                    validationMessage="Enter at least 7 digits"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                                    Email Address{newEmails.length > 1 ? "es" : ""}
                                                </Label>
                                                <MultiInput
                                                    values={newEmails}
                                                    onChange={setNewEmails}
                                                    placeholder="example@email.com"
                                                    maxItems={5}
                                                    icon={<Mail className="w-4 h-4" />}
                                                    validateFn={validateEmail}
                                                    normalizeFn={(v) => v.toLowerCase().trim()}
                                                    addLabel="Add another email"
                                                    validationMessage="Enter a valid email address"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                                                    Facebook Profile{newFacebooks.length > 1 ? "s" : ""}
                                                </Label>
                                                <MultiInput
                                                    values={newFacebooks}
                                                    onChange={setNewFacebooks}
                                                    placeholder="facebook.com/username or profile link"
                                                    maxItems={5}
                                                    icon={<Facebook className="w-4 h-4" />}
                                                    normalizeFn={normalizeFacebookLink}
                                                    addLabel="Add another Facebook"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {amendmentType === "NEW_EVIDENCE" && (
                                        <div className="space-y-3">
                                            <Label>Upload Files</Label>
                                            <div 
                                                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-secondary/50 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Images, PDFs, or documents
                                                </p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*,.pdf,.doc,.docx"
                                            />
                                            {amendmentFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    {amendmentFiles.map((file, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                                            <FileIcon className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm flex-1 truncate">{file.name}</span>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => removeFile(idx)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Optional note for all types */}
                                    {amendmentType && amendmentType !== "ADDITIONAL_INFO" && amendmentType !== "CORRECTION" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Additional Notes (optional)</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Any additional context you'd like to provide..."
                                                value={amendmentNotes}
                                                onChange={(e) => setAmendmentNotes(e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    )}

                                    {amendmentError && (
                                        <p className="text-sm text-destructive">{amendmentError}</p>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Button 
                                            onClick={handleSubmitAmendment}
                                            disabled={isSubmittingAmendment || !amendmentType}
                                            className="gap-2"
                                        >
                                            {isSubmittingAmendment ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            Submit for Review
                                        </Button>
                                        <Button variant="ghost" onClick={resetAmendmentForm}>
                                            Cancel
                                        </Button>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Note: New information will be reviewed by our team before being added to your report.
                                        {report?.status === "APPROVED" && " This won't affect the already published report until approved."}
                                    </p>
                                </div>
                            )}

                            {/* Existing Amendments List */}
                            {amendments.length === 0 && !showAmendmentForm ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No amendments submitted yet. Click "Add More Details" to provide additional information.
                                </p>
                            ) : amendments.length > 0 && (
                                <div className="space-y-3">
                                    {amendments.map((amendment) => {
                                        const typeConfig = AMENDMENT_TYPE_LABELS[amendment.amendment_type]
                                        const statusConfig = AMENDMENT_STATUS_CONFIG[amendment.status as keyof typeof AMENDMENT_STATUS_CONFIG]
                                        const StatusIcon = statusConfig?.icon || Clock
                                        const amendEvidence = amendmentEvidence[amendment.id] || []
                                        const changes = amendment.changes_json as AmendmentFormData["changes"]

                                        return (
                                            <div key={amendment.id} className="p-4 bg-muted/20 rounded-lg border">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-xl">{typeConfig?.icon || "📝"}</span>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-sm">
                                                                    {typeConfig?.label || amendment.amendment_type}
                                                                </span>
                                                                <Badge className={`${statusConfig?.color} border text-xs`}>
                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                    {statusConfig?.label}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Submitted {new Date(amendment.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {amendment.status === "PENDING" && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                            onClick={() => handleDeleteAmendment(amendment.id)}
                                                            disabled={deletingAmendmentId === amendment.id}
                                                        >
                                                            {deletingAmendmentId === amendment.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Show changes content */}
                                                {changes.additionalNotes && (
                                                    <p className="text-sm mt-3 bg-muted/30 p-3 rounded-lg">
                                                        {changes.additionalNotes}
                                                    </p>
                                                )}

                                                {/* New identifiers (supports both single and multiple) */}
                                                {(changes.phone || changes.email || changes.facebookLink || 
                                                  changes.phones?.length || changes.emails?.length || changes.facebookLinks?.length) && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {/* Show multiple phones or single phone */}
                                                        {(changes.phones || (changes.phone ? [changes.phone] : [])).map((phone: string, idx: number) => (
                                                            <Badge key={`phone-${idx}`} variant="outline" className="text-xs gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {phone}
                                                            </Badge>
                                                        ))}
                                                        {/* Show multiple emails or single email */}
                                                        {(changes.emails || (changes.email ? [changes.email] : [])).map((email: string, idx: number) => (
                                                            <Badge key={`email-${idx}`} variant="outline" className="text-xs gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {email}
                                                            </Badge>
                                                        ))}
                                                        {/* Show multiple facebooks or single facebook */}
                                                        {(changes.facebookLinks || (changes.facebookLink ? [changes.facebookLink] : [])).map((fb: string, idx: number) => (
                                                            <Badge key={`fb-${idx}`} variant="outline" className="text-xs gap-1">
                                                                <Facebook className="w-3 h-3" />
                                                                {idx === 0 ? "Facebook" : `Facebook ${idx + 1}`}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Reporter notes */}
                                                {amendment.reporter_notes && (
                                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                                        "{amendment.reporter_notes}"
                                                    </p>
                                                )}

                                                {/* Amendment evidence */}
                                                {amendEvidence.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-border/50">
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {amendEvidence.length} file{amendEvidence.length !== 1 ? "s" : ""} attached
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {amendEvidence.map((ev) => (
                                                                <button
                                                                    key={ev.id}
                                                                    onClick={() => handleViewEvidence(ev)}
                                                                    className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs hover:bg-muted transition-colors"
                                                                >
                                                                    <FileIcon className="w-3 h-3" />
                                                                    <span className="truncate max-w-[100px]">{ev.file_name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rejection reason */}
                                                {amendment.status === "REJECTED" && amendment.rejection_reason && (
                                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                        <p className="text-xs text-red-300 font-medium">Rejection Reason:</p>
                                                        <p className="text-xs text-red-200/70 mt-1">{amendment.rejection_reason}</p>
                                                    </div>
                                                )}

                                                {/* Admin notes */}
                                                {amendment.admin_notes && (
                                                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                        <p className="text-xs text-blue-300 font-medium">Admin Note:</p>
                                                        <p className="text-xs text-blue-200/70 mt-1">{amendment.admin_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Timeline</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                                    <div>
                                        <p className="text-sm font-medium">Submitted</p>
                                        <p className="text-xs text-muted-foreground">
                                            {report.submitted_at ? new Date(report.submitted_at).toLocaleString() : "—"}
                                        </p>
                                    </div>
                                </div>
                                {report.reviewed_at && (
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                                        <div>
                                            <p className="text-sm font-medium">Reviewed</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(report.reviewed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {report.status === "APPROVED" && report.published_at && (
                                    <div className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" />
                                        <div>
                                            <p className="text-sm font-medium">Published</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(report.published_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report Info */}
                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Report Info</h3>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Report ID</dt>
                                    <dd className="font-mono text-xs">{report.id.slice(0, 8)}...</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd>{new Date(report.created_at || "").toLocaleDateString()}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Evidence</dt>
                                    <dd>{evidence.length} file{evidence.length !== 1 ? "s" : ""}</dd>
                                </div>
                                {report.renter_id && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Linked to Renter</dt>
                                        <dd className="text-emerald-400">Yes</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Help */}
                        <div className="bg-muted/30 border border-dashed rounded-xl p-6">
                            <h3 className="font-semibold mb-2">Need Help?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Questions about your report status or the review process?
                            </p>
                            <Button variant="outline" size="sm" className="w-full">
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
