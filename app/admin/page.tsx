"use client"

import {
    checkIsAdmin,
    getAdminEvidenceUrl,
    getAdminStats,
    getAllReports,
    getReportDetails,
    getReportEditHistory,
    updateReportDetails,
    updateReportStatus,
} from "@/app/actions/admin"
import { logout } from "@/app/actions/auth"
import { AdminUserCreditTable } from "@/components/admin/admin-user-credit-table"
import { CreditConfigTable } from "@/components/admin/credit-config-table"
import { DisputesTable } from "@/components/admin/disputes-table"
import { ReportEditorDialog } from "@/components/admin/report-editor-dialog"
import { ReportHistoryDialog } from "@/components/admin/report-history-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { signOutClient, useAuth } from "@/lib/auth/auth-provider"
import type { Database, Enums } from "@/lib/database.types"
import {
    AlertTriangle,
    Ban,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    DollarSign,
    Edit,
    ExternalLink,
    Eye,
    Facebook,
    FileCheck,
    FileText,
    History,
    Home,
    ImageIcon,
    Loader2,
    LogOut,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    User,
    XCircle
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]
type Evidence = Database["public"]["Tables"]["report_evidence"]["Row"]

const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", icon: FileText },
    PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
    UNDER_REVIEW: { label: "Reviewing", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Eye },
    APPROVED: { label: "Approved", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
    DISPUTED: { label: "Disputed", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: AlertTriangle },
    RESOLVED: { label: "Resolved", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: CheckCircle2 },
    DELETED: { label: "Disputed & Approved", color: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: Trash2 },
}

const INCIDENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    NON_RETURN: { label: "Non-return", icon: "📦" },
    UNPAID_BALANCE: { label: "Unpaid Balance", icon: "💸" },
    DAMAGE_DISPUTE: { label: "Damage Dispute", icon: "🔧" },
    FAKE_INFO: { label: "Fake Info", icon: "🎭" },
    THREATS_HARASSMENT: { label: "Threats/Harassment", icon: "⚠️" },
    OTHER: { label: "Other", icon: "📋" },
}

export default function AdminPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const tabParam = searchParams.get('tab')
    const [view, setView] = useState<"REPORTS" | "CONFIG" | "USERS" | "DISPUTES">(
        tabParam?.toUpperCase() === 'CONFIG' ? 'CONFIG' :
        tabParam?.toUpperCase() === 'USERS' ? 'USERS' :
        tabParam?.toUpperCase() === 'DISPUTES' ? 'DISPUTES' :
        'REPORTS'
    )
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>>["data"] | null>(null)
    const [reports, setReports] = useState<Report[]>([])
    const [totalReports, setTotalReports] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("PENDING")
    const [searchQuery, setSearchQuery] = useState("")

    // Selected report for detail view
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [selectedEvidence, setSelectedEvidence] = useState<Evidence[]>([])
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)

    // Action states
    const [isPending, startTransition] = useTransition()
    const [actionError, setActionError] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [showRejectDialog, setShowRejectDialog] = useState(false)

    // File viewer state
    const [fileViewer, setFileViewer] = useState<{ open: boolean; url: string; name: string; type?: string }>({
        open: false,
        url: "",
        name: "",
    })

    // Edit dialog state
    const [showEditDialog, setShowEditDialog] = useState(false)

    // History dialog state
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)

    const { user, loading: authLoading } = useAuth()

    // Function to change tab and update URL
    const changeTab = (newView: "REPORTS" | "CONFIG" | "USERS" | "DISPUTES") => {
        setView(newView)
        router.push(`/admin?tab=${newView.toLowerCase()}`)
    }

    // Sync view with URL params
    useEffect(() => {
        const currentTab = searchParams.get('tab')
        if (currentTab) {
            const normalizedTab = currentTab.toUpperCase()
            if (['REPORTS', 'CONFIG', 'USERS', 'DISPUTES'].includes(normalizedTab)) {
                setView(normalizedTab as "REPORTS" | "CONFIG" | "USERS" | "DISPUTES")
            }
        }
    }, [searchParams])

    const handleLogout = async () => {
        await signOutClient()
        startTransition(async () => {
            await logout()
        })
    }

    // Check admin access
    useEffect(() => {
        const checkAccess = async () => {
            if (!authLoading && !user) {
                router.push("/login?redirect=/admin")
                return
            }

            if (user) {
                const result = await checkIsAdmin()
                if (result.success && result.data) {
                    setIsAdmin(result.data.isAdmin)
                    setAdminRole(result.data.role)
                    if (!result.data.isAdmin) {
                        setError("You don't have admin access")
                    }
                }
            }
        }
        checkAccess()
    }, [user, authLoading, router])

    // Fetch data
    const fetchData = async () => {
        if (!isAdmin) return

        setIsLoading(true)
        setError(null)

        const [statsResult, reportsResult] = await Promise.all([
            getAdminStats(),
            getAllReports({
                status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                search: searchQuery || undefined,
                limit: 50,
            }),
        ])

        if (statsResult.success && statsResult.data) {
            setStats(statsResult.data)
        }

        if (reportsResult.success && reportsResult.data) {
            setReports(reportsResult.data.reports)
            setTotalReports(reportsResult.data.total)
        } else {
            setError(reportsResult.error || "Failed to load reports")
        }

        setIsLoading(false)
    }

    useEffect(() => {
        if (isAdmin) {
            fetchData()
        }
    }, [isAdmin, statusFilter])

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAdmin) {
                fetchData()
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load report details
    const loadReportDetails = async (report: Report) => {
        setSelectedReport(report)
        setIsLoadingDetails(true)
        setSelectedEvidence([])

        const result = await getReportDetails(report.id)
        if (result.success && result.data) {
            setSelectedEvidence(result.data.evidence)
        }
        setIsLoadingDetails(false)
    }

    // Handle status change
    const handleStatusChange = async (newStatus: Enums<"report_status">) => {
        if (!selectedReport) return
        setActionError(null)

        if (newStatus === "REJECTED" && !rejectionReason.trim()) {
            setShowRejectDialog(true)
            return
        }

        startTransition(async () => {
            const result = await updateReportStatus(
                selectedReport.id,
                newStatus,
                undefined,
                newStatus === "REJECTED" ? rejectionReason : undefined
            )

            if (result.success) {
                setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null)
                setShowRejectDialog(false)
                setRejectionReason("")
                fetchData()
            } else {
                setActionError(result.error || "Failed to update status")
            }
        })
    }

    // Get evidence URL
    const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({})

    const loadEvidenceUrl = async (evidence: Evidence) => {
        if (evidenceUrls[evidence.id]) return

        const result = await getAdminEvidenceUrl(evidence.storage_path)
        if (result.success && result.data) {
            setEvidenceUrls(prev => ({ ...prev, [evidence.id]: result.data!.url }))
        }
    }

    // Copy to clipboard
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    // Handle view evidence with inline viewer
    const handleViewEvidence = async (ev: Evidence) => {
        const result = await getAdminEvidenceUrl(ev.storage_path)
        if (result.success && result.data) {
            setFileViewer({
                open: true,
                url: result.data.url,
                name: ev.file_name,
                type: ev.mime_type || undefined,
            })
        }
    }

    // Handle edit report
    const handleEditReport = async (updates: Partial<Report>, changeNote: string) => {
        if (!selectedReport) return

        const result = await updateReportDetails(selectedReport.id, updates, changeNote)
        if (result.success) {
            // Refresh report details
            await loadReportDetails(selectedReport)
            fetchData()
        } else {
            alert(result.error || "Failed to update report")
        }
    }

    // Handle load history
    const handleLoadHistory = async (reportId: string) => {
        const result = await getReportEditHistory(reportId)
        if (result.success && result.data) {
            return result.data
        }
        return []
    }

    if (authLoading || isAdmin === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Checking access...</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You don't have permission to access the admin dashboard.
                    </p>
                    <Link href="/">
                        <Button>
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b">
                <div className="px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-2">
                                <Image src="/logos/rc-logo.svg" alt="RenterCheck" width={28} height={28} />
                                <span className="font-bold hidden sm:inline">RenterCheck</span>
                            </Link>
                            <div className="h-5 w-px bg-border hidden sm:block" />
                            <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-secondary" />
                                <span className="text-sm font-medium">Admin</span>
                                {adminRole && (
                                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                                        {adminRole}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link href="/search">
                                <Button size="sm" variant="ghost" className="h-8 px-2 gap-1">
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Search</span>
                                </Button>
                            </Link>
                            {user && (
                                <Button size="sm" variant="ghost" onClick={handleLogout} disabled={isPending} className="h-8 px-2 gap-1">
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign out</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Compact Sidebar */}
                <aside className="hidden lg:block w-56 border-r p-4 space-y-4 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Overview</h3>
                        <div className="space-y-2">
                            <div className="bg-card border rounded-lg p-2.5">
                                <div className="text-2xl font-bold text-amber-400">{stats?.pending_count || 0}</div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div className="bg-card border rounded-lg p-2.5">
                                <div className="text-2xl font-bold text-blue-400">{stats?.under_review_count || 0}</div>
                                <div className="text-xs text-muted-foreground">Reviewing</div>
                            </div>
                            <div className="bg-card border rounded-lg p-2.5">
                                <div className="text-2xl font-bold text-emerald-400">{stats?.approved_count || 0}</div>
                                <div className="text-xs text-muted-foreground">Approved</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Activity</h3>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last 24h</span>
                                <span className="font-medium">{stats?.reports_last_24h || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last 7d</span>
                                <span className="font-medium">{stats?.reports_last_7d || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Reporters</span>
                                <span className="font-medium">{stats?.unique_reporters || 0}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 overflow-y-auto">
                    {/* Mobile Compact Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
                        <div className="bg-card border rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-amber-400">{stats?.pending_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="bg-card border rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-blue-400">{stats?.under_review_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Review</div>
                        </div>
                        <div className="bg-card border rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-emerald-400">{stats?.approved_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                    </div>

                    {/* Tabs / Filters */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <button
                                onClick={() => changeTab("REPORTS")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === "REPORTS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Reports
                            </button>
                            <button
                                onClick={() => changeTab("CONFIG")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === "CONFIG" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Credit Settings
                            </button>
                            <button
                                onClick={() => changeTab("USERS")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === "USERS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Users
                            </button>
                            <button
                                onClick={() => changeTab("DISPUTES")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === "DISPUTES" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Disputes
                            </button>
                        </div>

                        {view === "REPORTS" && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:max-w-xs">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search reports..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9 text-sm w-full"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-32 h-9 text-sm">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="UNDER_REVIEW">Review</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="DELETED">Disputed & Approved</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button size="sm" variant="outline" onClick={fetchData} disabled={isLoading} className="h-9 w-9 p-0">
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        )}

                        {view === "REPORTS" && (
                            <span className="text-xs text-muted-foreground hidden lg:inline">
                                {totalReports} report{totalReports !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {/* Content Area */}
                    {view === "CONFIG" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CreditConfigTable />
                        </div>
                    ) : view === "USERS" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AdminUserCreditTable />
                        </div>
                    ) : view === "DISPUTES" ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <DisputesTable />
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                    <span className="text-destructive text-sm">{error}</span>
                                </div>
                            )}

                            {/* Reports Grid - 2 Column with Accordion */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                {isLoading ? (
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
                                ) : reports.length === 0 ? (
                                    <div className="col-span-full bg-card border rounded-lg p-12 text-center">
                                        <FileCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                                        <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                                    </div>
                                ) : (
                                    reports.map((report) => {
                                        const status = report.status || "PENDING"
                                        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                                        const incidentInfo = INCIDENT_TYPE_LABELS[report.incident_type] || { label: report.incident_type, icon: "📋" }
                                        const isExpanded = selectedReport?.id === report.id

                                        return (
                                            <div
                                                key={report.id}
                                                className={`bg-card border rounded-lg overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-secondary/30 shadow-lg" : "hover:border-secondary/50"
                                                    }`}
                                            >
                                                {/* Card Header / Summary */}
                                                <div
                                                    onClick={() => {
                                                        if (isExpanded) {
                                                            setSelectedReport(null)
                                                        } else {
                                                            loadReportDetails(report)
                                                        }
                                                    }}
                                                    className="p-4 cursor-pointer"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color} border`}>
                                                            <div className="text-lg">{incidentInfo.icon}</div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-medium text-base truncate flex items-center gap-2">
                                                                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                        {report.reported_full_name}
                                                                    </h3>
                                                                    <p className="text-sm text-muted-foreground">{incidentInfo.label}</p>
                                                                </div>
                                                                <Badge className={`${config.color} border text-xs px-2 py-0.5 h-6 shrink-0`}>
                                                                    {config.label}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {new Date(report.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                                {report.amount_involved && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <DollarSign className="w-3.5 h-3.5" />
                                                                        ₱{report.amount_involved.toLocaleString()}
                                                                    </span>
                                                                )}
                                                                {(report.incident_city || report.incident_region) && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <MapPin className="w-3.5 h-3.5" />
                                                                        {[report.incident_city, report.incident_region].filter(Boolean).join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 self-center ${isExpanded ? "rotate-180" : ""}`} />
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                <div
                                                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                                        }`}
                                                >
                                                    <div className="overflow-hidden min-h-0">
                                                        <div className="border-t bg-muted/30 p-5 space-y-5">
                                                            {/* Header Actions */}
                                                            <div className="flex items-center justify-between pb-4 border-b">
                                                                <div className="text-xs text-muted-foreground">
                                                                    <span className="font-medium">ID:</span> <span className="font-mono">{report.id.slice(0, 8)}...</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowEditDialog(true);
                                                                        }}
                                                                        className="h-8 px-2 gap-1.5 hover:bg-background"
                                                                        title="Edit Report"
                                                                    >
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowHistoryDialog(true);
                                                                        }}
                                                                        className="h-8 px-2 gap-1.5 hover:bg-background"
                                                                        title="View Edit History"
                                                                    >
                                                                        <History className="w-3.5 h-3.5" />
                                                                        History
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Status Management */}
                                                            <div>
                                                                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Status Management</h3>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {report.status === "PENDING" && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleStatusChange("UNDER_REVIEW")}
                                                                            disabled={isPending}
                                                                            className="h-8"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5 mr-2" />
                                                                            Mark for Review
                                                                        </Button>
                                                                    )}
                                                                    {(report.status === "PENDING" || report.status === "UNDER_REVIEW") && (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleStatusChange("APPROVED")}
                                                                                disabled={isPending}
                                                                                className="h-8 bg-emerald-600 hover:bg-emerald-700"
                                                                            >
                                                                                <Check className="w-3.5 h-3.5 mr-2" />
                                                                                Approve
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => setShowRejectDialog(true)}
                                                                                disabled={isPending}
                                                                                className="h-8"
                                                                            >
                                                                                <Ban className="w-3.5 h-3.5 mr-2" />
                                                                                Reject
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {actionError && (
                                                                    <p className="text-xs text-destructive mt-2">{actionError}</p>
                                                                )}

                                                                {/* Rejection Dialog (Inline) */}
                                                                {showRejectDialog && (
                                                                    <div className="mt-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                                                        <p className="text-xs font-medium mb-2">Reason for Rejection</p>
                                                                        <Textarea
                                                                            value={rejectionReason}
                                                                            onChange={(e) => setRejectionReason(e.target.value)}
                                                                            placeholder="Explain why this report is being rejected..."
                                                                            className="text-xs min-h-[80px] mb-3 resize-none bg-background"
                                                                        />
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => {
                                                                                    setShowRejectDialog(false)
                                                                                    setRejectionReason("")
                                                                                }}
                                                                                className="h-7 text-xs"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => handleStatusChange("REJECTED")}
                                                                                disabled={isPending || !rejectionReason.trim()}
                                                                                className="h-7 text-xs"
                                                                            >
                                                                                Confirm Rejection
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Renter Information */}
                                                            <div>
                                                                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Renter Information</h3>
                                                                <div className="space-y-2">
                                                                    {report.reported_phone && (
                                                                        <div className="flex items-center gap-3 text-sm">
                                                                            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                            <div className="flex items-center gap-2 font-mono">
                                                                                {report.reported_phone}
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                                                                    onClick={() => copyToClipboard(report.reported_phone!)}
                                                                                    title="Copy Phone"
                                                                                >
                                                                                    <Copy className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
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
                                                                    {report.reported_address && (
                                                                        <div className="flex items-start gap-3 text-sm">
                                                                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                                            <span>{report.reported_address}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Incident Summary */}
                                                            {report.summary && (
                                                                <div>
                                                                    <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Summary</h3>
                                                                    <div className="bg-background border rounded-lg p-3 text-sm leading-relaxed">
                                                                        {report.summary}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Evidence */}
                                                            <div>
                                                                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                                                                    Evidence
                                                                    {selectedEvidence.length > 0 && (
                                                                        <Badge variant="secondary" className="px-1.5 h-5 text-[10px]">{selectedEvidence.length}</Badge>
                                                                    )}
                                                                </h3>

                                                                {isLoadingDetails && (!selectedEvidence || selectedEvidence.length === 0) ? (
                                                                    <div className="flex items-center justify-center p-8 bg-background border rounded-lg border-dashed">
                                                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                                    </div>
                                                                ) : selectedEvidence.length === 0 ? (
                                                                    <div className="text-sm text-muted-foreground italic bg-background border rounded-lg p-4 text-center border-dashed">
                                                                        No evidence attached to this report.
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {selectedEvidence.map((ev) => (
                                                                            <div
                                                                                key={ev.id}
                                                                                className="flex items-center gap-3 p-3 bg-background border rounded-lg cursor-pointer hover:bg-secondary/5 hover:border-secondary/30 transition-all group"
                                                                                onClick={() => handleViewEvidence(ev)}
                                                                            >
                                                                                <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/10 transition-colors">
                                                                                    <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-secondary" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium truncate">{ev.file_name}</p>
                                                                                    <p className="text-xs text-muted-foreground uppercase">{ev.evidence_type}</p>
                                                                                </div>
                                                                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-secondary opacity-0 group-hover:opacity-100 transition-all" />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Report Meta */}
                                                            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                                                                <p>Submitted by: <span className="font-medium text-foreground">{report.reporter_email}</span></p>
                                                                <p>{new Date(report.created_at || "").toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </>
                    )}

                    {/* Dialogs */}
                    <FileViewerDialog
                        open={fileViewer.open}
                        onOpenChange={(open) => setFileViewer({ ...fileViewer, open })}
                        fileUrl={fileViewer.url}
                        fileName={fileViewer.name}
                        fileType={fileViewer.type}
                    />

                    {selectedReport && (
                        <>
                            <ReportEditorDialog
                                open={showEditDialog}
                                onOpenChange={setShowEditDialog}
                                report={selectedReport}
                                onSave={handleEditReport}
                            />

                            <ReportHistoryDialog
                                open={showHistoryDialog}
                                onOpenChange={setShowHistoryDialog}
                                reportId={selectedReport.id}
                                onLoadHistory={handleLoadHistory}
                            />
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
