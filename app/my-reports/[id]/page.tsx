"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppHeader } from "@/components/shared/app-header"
import { getReportById, getEvidenceUrl } from "@/app/actions/report"
import type { Database } from "@/lib/database.types"
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
    Download,
    ExternalLink,
    ImageIcon,
    FileIcon,
    Loader2,
    DollarSign,
    Home,
    Cake,
} from "lucide-react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]
type Evidence = Database["public"]["Tables"]["report_evidence"]["Row"]
type InfoRequest = Database["public"]["Tables"]["report_info_requests"]["Row"]

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
    const reportId = params.id as string

    const [report, setReport] = useState<Report | null>(null)
    const [evidence, setEvidence] = useState<Evidence[]>([])
    const [infoRequests, setInfoRequests] = useState<InfoRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loadingEvidence, setLoadingEvidence] = useState<string | null>(null)

    useEffect(() => {
        async function fetchReport() {
            setIsLoading(true)
            setError(null)

            const result = await getReportById(reportId)

            if (result.success && result.data) {
                setReport(result.data.report)
                setEvidence(result.data.evidence)
                setInfoRequests(result.data.infoRequests)
            } else {
                setError(result.error || "Failed to load report")
            }

            setIsLoading(false)
        }

        if (reportId) {
            fetchReport()
        }
    }, [reportId])

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
                                <div>
                                    <h3 className="font-semibold mb-1">{statusConfig.label}</h3>
                                    <p className="text-sm text-muted-foreground">{statusConfig.description}</p>
                                </div>
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
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {report.reported_phone && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <p className="text-sm font-medium">{report.reported_phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {report.reported_email && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="text-sm font-medium">{report.reported_email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {report.reported_facebook && (
                                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                            <Facebook className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Facebook</p>
                                                <p className="text-sm font-medium truncate">{report.reported_facebook}</p>
                                            </div>
                                        </div>
                                    )}
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
