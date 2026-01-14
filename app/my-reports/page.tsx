"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileText,
    Calendar,
    Plus,
    RefreshCw,
    Eye,
    MessageSquare,
    ChevronRight,
    User,
    Loader2,
    X,
    Phone,
    Mail,
    Facebook,
    MapPin,
    DollarSign,
    Search,
    ImageIcon,
    ExternalLink,
} from "lucide-react"
import { getMyReports } from "@/app/actions/report"
import type { Views } from "@/lib/database.types"
import { useAuth } from "@/lib/auth/auth-provider"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/shared/app-header"
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog"
import { loadReportsCache, saveReportsCache } from "@/lib/cache/reports-cache"

type MyReport = Views<"my_reports">

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
    const [selectedReport, setSelectedReport] = useState<MyReport | null>(null)
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

            <main className="container mx-auto px-4 md:px-6 py-4">
                {/* Horizontal Stats Cards */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-card border rounded-lg p-3">
                        <div className="text-xl font-bold">{reports.length}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3">
                        <div className="text-xl font-bold text-amber-400">{statusCounts.PENDING || 0}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3">
                        <div className="text-xl font-bold text-emerald-400">{statusCounts.APPROVED || 0}</div>
                        <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="bg-card border rounded-lg p-3">
                        <div className="text-xl font-bold text-blue-400">{statusCounts.UNDER_REVIEW || 0}</div>
                        <div className="text-xs text-muted-foreground">Reviewing</div>
                    </div>
                </div>

                {/* Page Header */}
                <div className="flex items-center justify-between mb-4">
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
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant={statusFilter === status ? "default" : "outline"}
                                    onClick={() => setStatusFilter(status)}
                                    className="text-xs h-7 px-2"
                                >
                                    {status === "ALL" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                                </Button>
                            ))}
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="h-7 w-7 p-0"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>

                        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                            {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
                            {lastFetchTime && !isLoading && (
                                <span className="ml-2 text-xs text-muted-foreground/70">
                                    · Updated {Math.floor((Date.now() - lastFetchTime) / 1000 / 60)}m ago
                                </span>
                            )}
                        </span>
                    </div>

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center mb-4 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <p className="text-destructive text-sm">{error}</p>
                    </div>
                )}

                {/* Content Grid */}
                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Reports List */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase">My Reports</h2>
                        
                        {/* Loading State */}
                        {isLoading && (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-card border rounded-lg p-3 animate-pulse">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-muted" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-muted rounded w-1/2" />
                                                <div className="h-2.5 bg-muted rounded w-1/3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && filteredReports.length === 0 && (
                            <div className="bg-card border rounded-lg p-8 text-center">
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

                            {/* Reports List */}
                            {!isLoading && !error && filteredReports.length > 0 && (
                    <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
                        {filteredReports.map((report) => {
                            const status = report.status || "PENDING"
                            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                            const incidentLabel = INCIDENT_TYPE_LABELS[report.incident_type || ""] || report.incident_type
                            const isSelected = selectedReport?.id === report.id

                            return (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={`bg-card border rounded-lg p-3 cursor-pointer transition-all hover:border-secondary/50 ${
                                        isSelected ? "border-secondary ring-1 ring-secondary/30 bg-secondary/5" : ""
                                    }`}
                                >
                                                <div className="flex items-start gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                                                        {config.icon && <config.icon className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-1.5 mb-1">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-medium text-sm truncate flex items-center gap-1.5">
                                                                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                                    {report.reported_full_name}
                                                                </h3>
                                                                <p className="text-xs text-muted-foreground">{incidentLabel}</p>
                                                            </div>
                                                            <Badge className={`${config.color} border text-xs px-1.5 py-0 h-5 shrink-0`}>
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {report.incident_date ? new Date(report.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                                            </span>
                                                            {report.amount_involved && (
                                                                <span className="flex items-center gap-1">
                                                                    <DollarSign className="w-3 h-3" />
                                                                    ₱{report.amount_involved.toLocaleString()}
                                                                </span>
                                                            )}
                                                            {report.evidence_count && report.evidence_count > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" />
                                                                    {report.evidence_count} file{report.evidence_count > 1 ? "s" : ""}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {report.summary && (
                                                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                                                {report.summary}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isSelected ? "rotate-90" : ""}`} />
                                                </div>

                                    {/* Info Request Alert */}
                                    {report.pending_requests && report.pending_requests > 0 && (
                                        <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                                            <p className="text-xs text-amber-300 flex-1">Admin requested additional information</p>
                                            <span className="text-xs text-amber-300 font-medium">Respond →</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Report Detail Panel */}
            <div className="lg:sticky lg:top-4">
                {selectedReport ? (
                    <div className="bg-card border rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-sm truncate">{selectedReport.reported_full_name}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {INCIDENT_TYPE_LABELS[selectedReport.incident_type || ""] || selectedReport.incident_type}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge className={`${STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.color || ""} border text-xs px-2 py-0.5 h-6 shrink-0`}>
                                    {STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.label || selectedReport.status}
                                </Badge>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedReport(null)} className="h-7 w-7 p-0">
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                            {/* Renter Information */}
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Renter Information</h3>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium">{selectedReport.reported_full_name}</span>
                                                </div>
                                                {selectedReport.reported_phone && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span>{selectedReport.reported_phone}</span>
                                                    </div>
                                                )}
                                                {selectedReport.reported_email && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate">{selectedReport.reported_email}</span>
                                                    </div>
                                                )}
                                                {selectedReport.reported_facebook && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <a 
                                                            href={selectedReport.reported_facebook} 
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
                                        {selectedReport.rental_category && (
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Rented Item</h3>
                                                <div className="space-y-1.5">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{selectedReport.rental_category}</span>
                                                    </div>
                                                    {selectedReport.rental_item_description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {selectedReport.rental_item_description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Incident Details */}
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Incident Details</h3>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span>
                                                        {selectedReport.incident_date 
                                                            ? new Date(selectedReport.incident_date).toLocaleDateString('en-US', { 
                                                                month: 'long', 
                                                                day: 'numeric', 
                                                                year: 'numeric' 
                                                            }) 
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                                {selectedReport.amount_involved && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="font-medium">₱{selectedReport.amount_involved.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {(selectedReport.incident_city || selectedReport.incident_place) && (
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                        <span>
                                                            {[selectedReport.incident_place, selectedReport.incident_city].filter(Boolean).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        {selectedReport.summary && (
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Summary</h3>
                                                <p className="text-sm leading-relaxed">{selectedReport.summary}</p>
                                            </div>
                                        )}

                        {/* Evidence */}
                        {selectedReport.evidence_count !== null && selectedReport.evidence_count > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Evidence ({selectedReport.evidence_count})
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    View detailed evidence files by visiting the full report page.
                                </p>
                            </div>
                        )}

                        {/* Admin Notes/Rejection Reason */}
                        {selectedReport.status === "REJECTED" && selectedReport.rejection_reason && (
                            <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded">
                                <h3 className="text-xs font-medium text-destructive mb-1">Rejection Reason</h3>
                                <p className="text-xs text-muted-foreground">{selectedReport.rejection_reason}</p>
                            </div>
                        )}

                        {/* Info Requests */}
                        {selectedReport.pending_requests !== null && selectedReport.pending_requests > 0 && (
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded">
                                <h3 className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Information Request ({selectedReport.pending_requests})
                                </h3>
                                <p className="text-xs text-muted-foreground mb-2">Admin has requested additional information.</p>
                                <Link href={`/my-reports/${selectedReport.id}`}>
                                    <Button size="sm" className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700">
                                        Respond to Request
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t space-y-2">
                            <Link href={`/my-reports/${selectedReport.id}#amendments`}>
                                <Button size="sm" variant="outline" className="w-full text-xs h-8">
                                    <Plus className="w-3 h-3 mr-1.5" />
                                    Add More Details
                                </Button>
                            </Link>
                            <Link href={`/my-reports/${selectedReport.id}`}>
                                <Button size="sm" variant="outline" className="w-full text-xs h-8">
                                    <Eye className="w-3 h-3 mr-1.5" />
                                    View Full Report
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-card border rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="font-semibold mb-1 text-sm">No Report Selected</h3>
                    <p className="text-xs text-muted-foreground">
                        Select a report from the list to view details
                    </p>
                </div>
            )}
        </div>
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
