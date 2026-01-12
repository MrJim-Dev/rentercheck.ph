"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    Filter,
    User,
    Loader2,
} from "lucide-react"
import { getMyReports } from "@/app/actions/report"
import type { Views } from "@/lib/database.types"
import { useAuth } from "@/lib/auth/auth-provider"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/shared/app-header"

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
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const fetchReports = async () => {
        setIsLoading(true)
        setError(null)
        const result = await getMyReports()
        if (result.success && result.data) {
            setReports(result.data)
        } else {
            setError(result.error || "Failed to load reports")
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/my-reports")
            return
        }
        if (user) {
            fetchReports()
        }
    }, [user, authLoading, router])

    const filteredReports = statusFilter === "ALL" 
        ? reports 
        : reports.filter(r => r.status === statusFilter)

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
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Reports</h1>
                        <p className="text-muted-foreground">
                            Track the status of your submitted incident reports
                        </p>
                    </div>
                    <Link href="/report">
                        <Button className="gap-2 bg-gradient-to-r from-secondary to-accent">
                            <Plus className="w-4 h-4" />
                            New Report
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card border rounded-xl p-4">
                        <div className="text-2xl font-bold">{reports.length}</div>
                        <div className="text-sm text-muted-foreground">Total Reports</div>
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                        <div className="text-2xl font-bold text-amber-400">{statusCounts.PENDING || 0}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                        <div className="text-2xl font-bold text-emerald-400">{statusCounts.APPROVED || 0}</div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                    <div className="bg-card border rounded-xl p-4">
                        <div className="text-2xl font-bold text-blue-400">{statusCounts.UNDER_REVIEW || 0}</div>
                        <div className="text-sm text-muted-foreground">Under Review</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="w-4 h-4" />
                        <span>Filter:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
                            <Button
                                key={status}
                                size="sm"
                                variant={statusFilter === status ? "default" : "outline"}
                                onClick={() => setStatusFilter(status)}
                                className="text-xs"
                            >
                                {status === "ALL" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                                {status !== "ALL" && statusCounts[status] ? ` (${statusCounts[status]})` : ""}
                            </Button>
                        ))}
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={fetchReports}
                        disabled={isLoading}
                        className="ml-auto gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                        <p className="text-destructive">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchReports}
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-5 bg-muted rounded w-1/3" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                    </div>
                                    <div className="h-6 w-24 bg-muted rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredReports.length === 0 && (
                    <div className="bg-card border rounded-xl p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {statusFilter === "ALL" ? "No reports yet" : `No ${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label.toLowerCase()} reports`}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {statusFilter === "ALL" 
                                ? "You haven't submitted any incident reports yet."
                                : "Try selecting a different filter."}
                        </p>
                        {statusFilter === "ALL" && (
                            <Link href="/report">
                                <Button className="gap-2 bg-gradient-to-r from-secondary to-accent">
                                    <Plus className="w-4 h-4" />
                                    Submit Your First Report
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Reports List */}
                {!isLoading && !error && filteredReports.length > 0 && (
                    <div className="space-y-4">
                        {filteredReports.map((report) => {
                            const status = report.status || "PENDING"
                            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                            const StatusIcon = config.icon

                            return (
                                <Link
                                    key={report.id}
                                    href={`/my-reports/${report.id}`}
                                    className="block"
                                >
                                    <div className="bg-card border rounded-xl p-6 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all group cursor-pointer">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg flex items-center gap-2 group-hover:text-secondary transition-colors">
                                                            <User className="w-4 h-4 text-muted-foreground" />
                                                            {report.reported_full_name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {INCIDENT_TYPE_LABELS[report.incident_type || ""] || report.incident_type}
                                                        </p>
                                                    </div>
                                                    <Badge className={`${config.color} border shrink-0`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {report.incident_date ? new Date(report.incident_date).toLocaleDateString() : "N/A"}
                                                    </span>
                                                    {report.evidence_count && report.evidence_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            {report.evidence_count} evidence file{report.evidence_count > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                    {report.pending_requests && report.pending_requests > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-400">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            {report.pending_requests} info request{report.pending_requests > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-muted-foreground">
                                                    Submitted {report.created_at ? new Date(report.created_at).toLocaleDateString() : "N/A"}
                                                    {report.id && (
                                                        <span className="ml-2 font-mono">
                                                            ID: {report.id.slice(0, 8)}...
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Action */}
                                            <div className="shrink-0 flex items-center gap-1 text-muted-foreground group-hover:text-secondary transition-colors">
                                                <span className="text-sm hidden sm:inline">View</span>
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>

                                        {/* Info Request Alert */}
                                        {report.pending_requests && report.pending_requests > 0 && (
                                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                                                <MessageSquare className="w-5 h-5 text-amber-400" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-amber-300">Action Required</p>
                                                    <p className="text-xs text-amber-300/70">Admin requested additional information</p>
                                                </div>
                                                <span className="text-xs text-amber-300 font-medium">Respond →</span>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {status === "REJECTED" && (
                                            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                                <p className="text-sm font-medium text-red-300 mb-1">Report Rejected</p>
                                                <p className="text-xs text-red-300/70">
                                                    Click to view rejection details and next steps.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
