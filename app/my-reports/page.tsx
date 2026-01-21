"use client"

import { getMyReports } from "@/app/actions/report"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth/auth-provider"
import { loadReportsCache, saveReportsCache } from "@/lib/cache/reports-cache"
import type { Database } from "@/lib/database.types"
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    ExternalLink,
    Eye,
    Facebook,
    FileText,
    ImageIcon,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    RefreshCw,
    Search,
    User,
    XCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type MyReport = Database["public"]["Views"]["my_reports"]["Row"]

const STATUS_CONFIG = {
    DRAFT: {
        label: "Draft",
        color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
        icon: FileText,
    },
    PENDING: {
        label: "Pending Review",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Clock,
    },
    UNDER_REVIEW: {
        label: "Under Review",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: Eye,
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
    DISPUTED: {
        label: "Disputed",
        color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        icon: AlertTriangle,
    },
    RESOLVED: {
        label: "Resolved",
        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        icon: CheckCircle2,
    },
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
    NON_RETURN: "Non-return",
    UNPAID_BALANCE: "Unpaid Balance",
    DAMAGE_DISPUTE: "Damage Dispute",
    FAKE_INFO: "Fake Info",
    THREATS_HARASSMENT: "Threats/Harassment",
    OTHER: "Other",
}

export default function MyReportsPage() {
    const [reports, setReports] = useState<MyReport[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
    const [fileViewer, setFileViewer] = useState<{ open: boolean; url: string; name: string; type?: string }>({
        open: false,
        url: "",
        name: "",
    })
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    // Fetch reports from API
    const fetchReports = useCallback(async (forceRefresh = false) => {
        // If not forcing refresh, try to use cached data first
        if (!forceRefresh) {
            const cachedData = loadReportsCache<MyReport>()
            if (cachedData) {
                setReports(cachedData.reports)
                setLastFetchTime(cachedData.timestamp)
                setIsLoading(false)
                return
            }
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await getMyReports()
            if (result.success && result.data) {
                setReports(result.data)
                saveReportsCache(result.data)
                setLastFetchTime(Date.now())
            } else {
                setError(result.error || "Failed to load reports")
            }
        } catch (err) {
            setError("An unexpected error occurred")
            console.error("Error fetching reports:", err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle manual refresh
    const handleRefresh = useCallback(() => {
        fetchReports(true)
    }, [fetchReports])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/my-reports")
            return
        }
        if (user) {
            fetchReports(false) // Use cached data if available
        }
    }, [user, authLoading, router, fetchReports])

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            // Search is handled by filtering on the frontend
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const filteredReports = reports.filter(r => {
        const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
        const matchesSearch = searchQuery === "" ||
            r.reported_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const statusCounts = reports.reduce((acc, report) => {
        const status = report.status || "PENDING"
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader currentPage="my-reports" />

            <main className="container mx-auto px-4 md:px-6 py-8">
                {/* Horizontal Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-xl font-bold">{reports.length}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-xl font-bold text-amber-400">{statusCounts.PENDING || 0}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-xl font-bold text-emerald-400">{statusCounts.APPROVED || 0}</div>
                        <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-xl font-bold text-blue-400">{statusCounts.UNDER_REVIEW || 0}</div>
                        <div className="text-xs text-muted-foreground">Reviewing</div>
                    </div>
                </div>

                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">My Reports</h1>
                        <p className="text-sm text-muted-foreground">
                            Track your submitted incident reports
                        </p>
                    </div>
                    <Link href="/report">
                        <Button size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Report
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-auto md:flex-1 md:max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm w-full"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
                            <Button
                                key={status}
                                size="sm"
                                variant="ghost"
                                onClick={() => setStatusFilter(status)}
                                className={`text-xs h-7 px-3 rounded-full transition-all duration-300 ${statusFilter === status
                                    ? "bg-secondary/20 border-secondary/30 text-secondary font-semibold border"
                                    : "text-muted-foreground hover:!bg-white/5 hover:!border-white/20 hover:text-white border border-muted-foreground/20"
                                    }`}
                            >
                                {status === "ALL" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                            </Button>
                        ))}

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="h-7 w-7 p-0 rounded-full border-muted-foreground/20 hover:!bg-white/5 hover:!border-white/20 hover:text-white border transition-all duration-300"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>

                    <div className="ml-auto md:ml-0 hidden sm:block">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
                            {lastFetchTime && !isLoading && (
                                <span className="ml-2 text-muted-foreground/70">
                                    · Updated {Math.floor((Date.now() - lastFetchTime) / 1000 / 60)}m ago
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center mb-4 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <p className="text-destructive text-sm">{error}</p>
                    </div>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Loading State */}
                    {isLoading && (
                        <>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-1/3" />
                                            <div className="h-3 bg-muted rounded w-1/4" />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="h-3 bg-muted rounded w-full" />
                                        <div className="h-3 bg-muted rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && filteredReports.length === 0 && (
                        <div className="col-span-full bg-card border rounded-lg p-8 text-center">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <h3 className="font-semibold mb-1">
                                {statusFilter === "ALL" ? "No reports yet" : `No ${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} reports`}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {statusFilter === "ALL"
                                    ? "You haven't submitted any incident reports yet."
                                    : "Try selecting a different filter or search term."}
                            </p>
                            {statusFilter === "ALL" && (
                                <Link href="/report">
                                    <Button size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Submit Your First Report
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Reports List - Expanded Grid */}
                    {!isLoading && !error && filteredReports.length > 0 && (
                        <>
                            {filteredReports.map((report) => {
                                const status = report.status || "PENDING"
                                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                                const incidentLabel = INCIDENT_TYPE_LABELS[report.incident_type || ""] || report.incident_type
                                const isExpanded = expandedReportId === report.id

                                return (
                                    <div
                                        key={report.id}
                                        className={`bg-card border rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-secondary/30 shadow-lg" : "hover:border-secondary/50"
                                            }`}
                                    >
                                        {/* Card Header / Summary */}
                                        <div
                                            onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                                            className="p-4 cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                                                    {config.icon && <config.icon className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-base truncate flex items-center gap-2">
                                                                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                {report.reported_full_name}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground">{incidentLabel}</p>
                                                        </div>
                                                        <Badge className={`${config.color} border text-xs px-2 py-0.5 h-6 shrink-0`}>
                                                            {config.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {report.incident_date ? new Date(report.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                                        </span>
                                                        {report.amount_involved && (
                                                            <span className="flex items-center gap-1.5">
                                                                <DollarSign className="w-3.5 h-3.5" />
                                                                ₱{report.amount_involved.toLocaleString()}
                                                            </span>
                                                        )}
                                                        {report.evidence_count > 0 && (
                                                            <span className="flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                {report.evidence_count} file{report.evidence_count > 1 ? "s" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 self-center ${isExpanded ? "rotate-180" : ""}`} />
                                            </div>

                                            {/* Info Request Alert (Summary) */}
                                            {!isExpanded && report.pending_requests > 0 && (
                                                <div className="mt-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                                                    <p className="text-xs text-amber-300 flex-1">Admin requested additional information</p>
                                                    <span className="text-xs text-amber-300 font-medium">Respond →</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Content with Smooth Animation */}
                                        <div
                                            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                                }`}
                                        >
                                            <div className="overflow-hidden min-h-0">
                                                <div className="border-t bg-muted/30 p-5 space-y-5">
                                                    {/* Renter Information */}
                                                    <div>
                                                        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Renter Information</h3>
                                                        <div className="space-y-2">
                                                            {report.reported_phone && (
                                                                <div className="flex items-center gap-3 text-sm">
                                                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span>{report.reported_phone}</span>
                                                                </div>
                                                            )}
                                                            {report.reported_email && (
                                                                <div className="flex items-center gap-3 text-sm">
                                                                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="truncate">{report.reported_email}</span>
                                                                </div>
                                                            )}
                                                            {report.reported_facebook && (
                                                                <div className="flex items-center gap-3 text-sm">
                                                                    <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <a
                                                                        href={report.reported_facebook}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-secondary hover:underline truncate flex items-center gap-1"
                                                                    >
                                                                        View Profile
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Rented Item */}
                                                    {report.rental_category && (
                                                        <div>
                                                            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Rented Item</h3>
                                                            <div className="space-y-2">
                                                                <div className="text-sm">
                                                                    <span className="font-medium">{report.rental_category}</span>
                                                                </div>
                                                                {report.rental_item_description && (
                                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                                        {report.rental_item_description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Incident Details */}
                                                    <div>
                                                        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Incident Details</h3>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 text-sm">
                                                                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                <span>
                                                                    {report.incident_date
                                                                        ? new Date(report.incident_date).toLocaleDateString('en-US', {
                                                                            month: 'long',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })
                                                                        : "N/A"}
                                                                </span>
                                                            </div>
                                                            {report.amount_involved && (
                                                                <div className="flex items-center gap-3 text-sm">
                                                                    <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium">₱{report.amount_involved.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {(report.incident_city || report.incident_place) && (
                                                                <div className="flex items-start gap-3 text-sm">
                                                                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                    <span>
                                                                        {[report.incident_place, report.incident_city].filter(Boolean).join(", ")}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Summary */}
                                                    {report.summary && (
                                                        <div>
                                                            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Summary</h3>
                                                            <p className="text-sm leading-relaxed">{report.summary}</p>
                                                        </div>
                                                    )}

                                                    {/* Evidence */}
                                                    {report.evidence_count > 0 && (
                                                        <div>
                                                            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase flex items-center gap-2 tracking-wide">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                Evidence ({report.evidence_count})
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground bg-background/50 border p-3 rounded-md">
                                                                View detailed evidence files by visiting the full report page.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Admin Notes/Rejection Reason */}
                                                    {report.status === "REJECTED" && report.rejection_reason && (
                                                        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                                                            <h3 className="text-xs font-medium text-destructive mb-1 uppercase tracking-wide">Rejection Reason</h3>
                                                            <p className="text-sm text-foreground/80">{report.rejection_reason}</p>
                                                        </div>
                                                    )}

                                                    {/* Info Requests */}
                                                    {report.pending_requests > 0 && (
                                                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                            <h3 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                Information Request ({report.pending_requests})
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mb-3">Admin has requested additional information.</p>
                                                            <Link href={`/my-reports/${report.id}`}>
                                                                <Button size="sm" className="w-full h-8 bg-amber-600 hover:bg-amber-700">
                                                                    Respond to Request
                                                                    <ChevronRight className="w-3 h-3 ml-1" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="pt-4 border-t space-y-3">
                                                        <Link href={`/my-reports/${report.id}#amendments`} className="block">
                                                            <Button size="sm" variant="outline" className="w-full h-9">
                                                                <Plus className="w-3.5 h-3.5 mr-2" />
                                                                Add More Details
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/my-reports/${report.id}`} className="block">
                                                            <Button size="sm" variant="outline" className="w-full h-9">
                                                                <Eye className="w-3.5 h-3.5 mr-2" />
                                                                View Full Report
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>
            </main>

            {/* File Viewer Dialog */}
            <FileViewerDialog
                open={fileViewer.open}
                onOpenChange={(open) => setFileViewer({ ...fileViewer, open })}
                fileUrl={fileViewer.url}
                fileName={fileViewer.name}
                fileType={fileViewer.type}
            />
        </div>
    )
}
