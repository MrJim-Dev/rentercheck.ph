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
    PenLine,
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

const RENTAL_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    CAMERA_EQUIPMENT: { label: "Camera", icon: "📷" },
    CLOTHING_FASHION: { label: "Clothing", icon: "👗" },
    ELECTRONICS_GADGETS: { label: "Electronics", icon: "📱" },
    VEHICLE_CAR: { label: "Car", icon: "🚗" },
    VEHICLE_MOTORCYCLE: { label: "Motorcycle", icon: "🏍️" },
    VEHICLE_BICYCLE: { label: "Bicycle", icon: "🚲" },
    REAL_ESTATE_CONDO: { label: "Condo", icon: "🏢" },
    REAL_ESTATE_HOUSE: { label: "House", icon: "🏠" },
    REAL_ESTATE_ROOM: { label: "Room", icon: "🛏️" },
    FURNITURE_APPLIANCES: { label: "Furniture", icon: "🪑" },
    EVENTS_PARTY: { label: "Events", icon: "🎉" },
    TOOLS_EQUIPMENT: { label: "Tools", icon: "🔧" },
    SPORTS_OUTDOOR: { label: "Sports", icon: "⚽" },
    JEWELRY_ACCESSORIES: { label: "Jewelry", icon: "💍" },
    BABY_KIDS: { label: "Baby & Kids", icon: "🧸" },
    OTHER: { label: "Other", icon: "📦" },
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

            <main className="container mx-auto px-4 md:px-6 py-4">
                {/* Compact Page Header */}
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

                {/* Compact Stats Cards */}
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

                {/* Compact Filters */}
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2 flex-1">
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
                        variant="ghost"
                        onClick={fetchReports}
                        disabled={isLoading}
                        className="h-7 w-7 p-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center mb-4 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <p className="text-destructive text-sm">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-muted rounded w-1/3" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
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
                                : "Try selecting a different filter."}
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

                {/* Compact Reports List */}
                {!isLoading && !error && filteredReports.length > 0 && (
                    <div className="space-y-2">
                        {filteredReports.map((report) => {
                            const status = report.status || "PENDING"
                            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                            const StatusIcon = config.icon

                            return (
                                <div
                                    key={report.id}
                                    className="bg-card border rounded-lg p-3 hover:border-secondary/50 hover:shadow transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Compact Icon */}
                                        <Link href={`/my-reports/${report.id}`} className="shrink-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${config.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                            </div>
                                        </Link>

                                        {/* Compact Content - Clickable */}
                                        <Link href={`/my-reports/${report.id}`} className="flex-1 min-w-0 cursor-pointer">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-sm flex items-center gap-1.5 truncate">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                    {report.reported_full_name}
                                                </h3>
                                                <Badge className={`${config.color} border text-xs px-2 py-0 h-5 shrink-0`}>
                                                    {config.label}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-2 flex-wrap">
                                                <span>{INCIDENT_TYPE_LABELS[report.incident_type || ""] || report.incident_type}</span>
                                                {report.rental_category && (
                                                    <span className="flex items-center gap-0.5 text-secondary">
                                                        {RENTAL_CATEGORY_LABELS[report.rental_category]?.icon}
                                                        {RENTAL_CATEGORY_LABELS[report.rental_category]?.label}
                                                    </span>
                                                )}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {report.incident_date ? new Date(report.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                                </span>
                                                {report.evidence_count && report.evidence_count > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {report.evidence_count} file{report.evidence_count > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                                {report.pending_requests && report.pending_requests > 0 && (
                                                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {report.pending_requests} request{report.pending_requests > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link href={`/my-reports/${report.id}?action=edit`}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-muted-foreground hover:text-secondary"
                                                    title="Add more details"
                                                >
                                                    <PenLine className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/my-reports/${report.id}`}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-muted-foreground hover:text-secondary"
                                                    title="View details"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Compact Info Request Alert */}
                                    {report.pending_requests && report.pending_requests > 0 && (
                                        <Link href={`/my-reports/${report.id}?action=edit`}>
                                            <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                                <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                                <p className="text-xs text-amber-300 flex-1">Admin requested additional information</p>
                                                <span className="text-xs text-amber-300 font-medium">Respond →</span>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
