"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import Image from "next/image"
import {
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileText,
    Calendar,
    DollarSign,
    MapPin,
    RefreshCw,
    Eye,
    MessageSquare,
    ChevronRight,
    Search,
    Filter,
    User,
    Phone,
    Mail,
    Facebook,
    LogOut,
    LayoutDashboard,
    Loader2,
    Users,
    TrendingUp,
    ChevronDown,
    X,
    Check,
    Ban,
    FileCheck,
    ExternalLink,
    Copy,
    Home,
    Edit,
    History,
    ImageIcon,
} from "lucide-react"
import {
    checkIsAdmin,
    getAdminStats,
    getAllReports,
    getReportDetails,
    updateReportStatus,
    getAdminEvidenceUrl,
    updateReportDetails,
    getReportEditHistory,
    getPendingAmendments,
    getAmendmentDetails,
    reviewAmendment,
    getAmendmentStats,
} from "@/app/actions/admin"
import type { Database, Enums } from "@/lib/database.types"
import { useAuth, signOutClient } from "@/lib/auth/auth-provider"
import { logout } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog"
import { ReportEditorDialog } from "@/components/admin/report-editor-dialog"
import { ReportHistoryDialog } from "@/components/admin/report-history-dialog"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]
type Evidence = Database["public"]["Tables"]["report_evidence"]["Row"]
type Amendment = Database["public"]["Views"]["admin_pending_amendments"]["Row"]

const AMENDMENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    ADDITIONAL_INFO: { label: "Additional Info", icon: "📝" },
    NEW_EVIDENCE: { label: "New Evidence", icon: "📎" },
    CORRECTION: { label: "Correction", icon: "✏️" },
    NEW_IDENTIFIER: { label: "New Contact", icon: "📱" },
}

const AMENDMENT_STATUS_CONFIG = {
    PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
    APPROVED: { label: "Approved", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
}

const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", icon: FileText },
    PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
    UNDER_REVIEW: { label: "Reviewing", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Eye },
    APPROVED: { label: "Approved", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
    DISPUTED: { label: "Disputed", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: AlertTriangle },
    RESOLVED: { label: "Resolved", color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: CheckCircle2 },
}

const INCIDENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
    NON_RETURN: { label: "Non-return", icon: "📦" },
    UNPAID_BALANCE: { label: "Unpaid Balance", icon: "💸" },
    DAMAGE_DISPUTE: { label: "Damage Dispute", icon: "🔧" },
    FAKE_INFO: { label: "Fake Info", icon: "🎭" },
    THREATS_HARASSMENT: { label: "Threats/Harassment", icon: "⚠️" },
    OTHER: { label: "Other", icon: "📋" },
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

export default function AdminPage() {
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
    
    // Amendments state
    const [amendments, setAmendments] = useState<Amendment[]>([])
    const [pendingAmendmentsCount, setPendingAmendmentsCount] = useState(0)
    const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null)
    const [amendmentEvidence, setAmendmentEvidence] = useState<Evidence[]>([])
    const [isLoadingAmendment, setIsLoadingAmendment] = useState(false)
    const [amendmentRejectionReason, setAmendmentRejectionReason] = useState("")
    const [showAmendmentRejectDialog, setShowAmendmentRejectDialog] = useState(false)
    const [activeTab, setActiveTab] = useState<"reports" | "amendments">("reports")
    
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

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

        const [statsResult, reportsResult, amendmentsResult, amendmentStatsResult] = await Promise.all([
            getAdminStats(),
            getAllReports({
                status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                search: searchQuery || undefined,
                limit: 50,
            }),
            getPendingAmendments({ status: "PENDING", limit: 50 }),
            getAmendmentStats(),
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

        if (amendmentsResult.success && amendmentsResult.data) {
            setAmendments(amendmentsResult.data.amendments)
        }

        if (amendmentStatsResult.success && amendmentStatsResult.data) {
            setPendingAmendmentsCount(amendmentStatsResult.data.pending)
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

    // Load amendment details
    const loadAmendmentDetails = async (amendment: Amendment) => {
        if (!amendment.id) return
        setSelectedAmendment(amendment)
        setIsLoadingAmendment(true)
        setAmendmentEvidence([])

        const result = await getAmendmentDetails(amendment.id)
        if (result.success && result.data) {
            setAmendmentEvidence(result.data.evidence)
        }
        setIsLoadingAmendment(false)
    }

    // Handle amendment review
    const handleAmendmentReview = async (decision: "APPROVED" | "REJECTED") => {
        if (!selectedAmendment?.id) return
        setActionError(null)

        if (decision === "REJECTED" && !amendmentRejectionReason.trim()) {
            setShowAmendmentRejectDialog(true)
            return
        }

        startTransition(async () => {
            const result = await reviewAmendment(
                selectedAmendment.id!,
                decision,
                undefined,
                decision === "REJECTED" ? amendmentRejectionReason : undefined
            )

            if (result.success) {
                setSelectedAmendment(null)
                setShowAmendmentRejectDialog(false)
                setAmendmentRejectionReason("")
                fetchData()
            } else {
                setActionError(result.error || "Failed to review amendment")
            }
        })
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
                <div className="container mx-auto px-4">
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

                    {/* Amendments Section */}
                    {pendingAmendmentsCount > 0 && (
                        <div>
                            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Amendments</h3>
                            <button
                                onClick={() => setActiveTab("amendments")}
                                className={`w-full bg-card border rounded-lg p-2.5 text-left transition-colors ${
                                    activeTab === "amendments" ? "border-secondary bg-secondary/10" : "hover:border-secondary/50"
                                }`}
                            >
                                <div className="text-2xl font-bold text-orange-400">{pendingAmendmentsCount}</div>
                                <div className="text-xs text-muted-foreground">Pending Review</div>
                            </button>
                        </div>
                    )}
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

                    {/* Tabs */}
                    <div className="flex items-center gap-4 mb-4 border-b pb-2">
                        <button
                            onClick={() => { setActiveTab("reports"); setSelectedAmendment(null); }}
                            className={`text-sm font-medium pb-2 border-b-2 -mb-2.5 transition-colors ${
                                activeTab === "reports" 
                                    ? "border-secondary text-secondary" 
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Reports
                            {stats?.pending_count ? (
                                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                                    {stats.pending_count}
                                </Badge>
                            ) : null}
                        </button>
                        <button
                            onClick={() => { setActiveTab("amendments"); setSelectedReport(null); }}
                            className={`text-sm font-medium pb-2 border-b-2 -mb-2.5 transition-colors ${
                                activeTab === "amendments" 
                                    ? "border-secondary text-secondary" 
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Amendments
                            {pendingAmendmentsCount > 0 && (
                                <Badge className="ml-1.5 h-5 px-1.5 text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                                    {pendingAmendmentsCount}
                                </Badge>
                            )}
                        </button>
                    </div>

                    {/* Compact Filters (only for reports tab) */}
                    {activeTab === "reports" && (
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm"
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
                                </SelectContent>
                            </Select>

                            <Button size="sm" variant="outline" onClick={fetchData} disabled={isLoading} className="h-9 w-9 p-0">
                                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                            </Button>

                            <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
                                {totalReports} report{totalReports !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                            <span className="text-destructive text-sm">{error}</span>
                        </div>
                    )}

                    {/* Compact Reports Grid */}
                    {activeTab === "reports" && (
                    <div className="grid lg:grid-cols-2 gap-4">
                        {/* Reports List */}
                        <div className="space-y-3">
                            <h2 className="font-semibold text-sm text-muted-foreground uppercase">Reports Queue</h2>
                            
                            {isLoading ? (
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
                            ) : reports.length === 0 ? (
                                <div className="bg-card border rounded-lg p-6 text-center">
                                    <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                    <p className="text-sm text-muted-foreground">No reports found</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                                    {reports.map((report) => {
                                        const status = report.status || "PENDING"
                                        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                                        const incidentInfo = INCIDENT_TYPE_LABELS[report.incident_type] || { label: report.incident_type, icon: "📋" }
                                        const isSelected = selectedReport?.id === report.id

                                        return (
                                            <div
                                                key={report.id}
                                                onClick={() => loadReportDetails(report)}
                                                className={`bg-card border rounded-lg p-3 cursor-pointer transition-all hover:border-secondary/50 ${
                                                    isSelected ? "border-secondary ring-1 ring-secondary/30 bg-secondary/5" : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="text-xl">{incidentInfo.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <div>
                                                                <h3 className="font-medium text-sm truncate">{report.reported_full_name}</h3>
                                                                <p className="text-xs text-muted-foreground">{incidentInfo.label}</p>
                                                            </div>
                                                            <Badge className={`${config.color} border text-xs px-1.5 py-0 h-5 shrink-0`}>
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                                            <span>{new Date(report.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                            {report.amount_involved && (
                                                                <span>₱{report.amount_involved.toLocaleString()}</span>
                                                            )}
                                                            {report.rental_category && (
                                                                <span className="flex items-center gap-0.5">
                                                                    {RENTAL_CATEGORY_LABELS[report.rental_category]?.icon}
                                                                    <span className="truncate max-w-[80px]">{RENTAL_CATEGORY_LABELS[report.rental_category]?.label}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isSelected ? "rotate-90" : ""}`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Compact Report Detail */}
                        <div className="lg:sticky lg:top-20">
                            {selectedReport ? (
                                <div className="bg-card border rounded-lg overflow-hidden">
                                    {/* Compact Header */}
                                    <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-semibold text-sm truncate">{selectedReport.reported_full_name}</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {INCIDENT_TYPE_LABELS[selectedReport.incident_type]?.label || selectedReport.incident_type}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => setShowEditDialog(true)}
                                                className="h-7 w-7 p-0"
                                                title="Edit Report"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => setShowHistoryDialog(true)}
                                                className="h-7 w-7 p-0"
                                                title="View Edit History"
                                            >
                                                <History className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedReport(null)} className="h-7 w-7 p-0">
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                                        {/* Status & Actions */}
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                <Badge className={`${STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.color || ""} border text-xs px-2 py-0 h-5`}>
                                                    {STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.label || selectedReport.status}
                                                </Badge>
                                                
                                                {selectedReport.status === "PENDING" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleStatusChange("UNDER_REVIEW")}
                                                        disabled={isPending}
                                                        className="h-6 text-xs px-2 gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        Review
                                                    </Button>
                                                )}
                                                
                                                {(selectedReport.status === "PENDING" || selectedReport.status === "UNDER_REVIEW") && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStatusChange("APPROVED")}
                                                            disabled={isPending}
                                                            className="h-6 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setShowRejectDialog(true)}
                                                            disabled={isPending}
                                                            className="h-6 text-xs px-2 gap-1"
                                                        >
                                                            <Ban className="w-3 h-3" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>

                                            {actionError && (
                                                <p className="text-xs text-destructive">{actionError}</p>
                                            )}

                                            {/* Compact Reject Dialog */}
                                            {showRejectDialog && (
                                                <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded space-y-2">
                                                    <p className="text-xs font-medium">Rejection Reason</p>
                                                    <Textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Explain why..."
                                                        className="text-xs h-16 resize-none"
                                                    />
                                                    <div className="flex gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleStatusChange("REJECTED")}
                                                            disabled={isPending || !rejectionReason.trim()}
                                                            className="h-7 text-xs"
                                                        >
                                                            Confirm
                                                        </Button>
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
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compact Renter Info */}
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Renter Information</h3>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium">{selectedReport.reported_full_name}</span>
                                                </div>
                                                {selectedReport.reported_phone && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span className="flex-1">{selectedReport.reported_phone}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-5 w-5 p-0"
                                                            onClick={() => copyToClipboard(selectedReport.reported_phone!)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {selectedReport.reported_email && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate">{selectedReport.reported_email}</span>
                                                    </div>
                                                )}
                                                {selectedReport.reported_facebook && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Facebook className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <a
                                                            href={selectedReport.reported_facebook}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-secondary hover:underline flex items-center gap-1"
                                                        >
                                                            View Profile
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedReport.reported_address && (
                                                    <div className="flex items-start gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <span className="flex-1">{selectedReport.reported_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rental Item Info */}
                                        {(selectedReport.rental_category || selectedReport.rental_item_description) && (
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Rented Item</h3>
                                                <div className="space-y-1.5 text-xs">
                                                    {selectedReport.rental_category && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{RENTAL_CATEGORY_LABELS[selectedReport.rental_category]?.icon || "📦"}</span>
                                                            <span className="font-medium">{RENTAL_CATEGORY_LABELS[selectedReport.rental_category]?.label || selectedReport.rental_category}</span>
                                                        </div>
                                                    )}
                                                    {selectedReport.rental_item_description && (
                                                        <div className="bg-muted/30 rounded px-2 py-1">
                                                            <span>{selectedReport.rental_item_description}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Compact Incident Details */}
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Incident Details</h3>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span>{new Date(selectedReport.incident_date).toLocaleDateString()}</span>
                                                </div>
                                                {selectedReport.amount_involved && (
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span>₱{selectedReport.amount_involved.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {(selectedReport.incident_region || selectedReport.incident_city) && (
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span>
                                                            {[selectedReport.incident_city, selectedReport.incident_region].filter(Boolean).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Compact Summary */}
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Summary</h3>
                                            <p className="text-xs bg-muted/30 rounded p-2">{selectedReport.summary}</p>
                                        </div>

                                        {/* Compact Evidence with Inline Viewer */}
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">
                                                Evidence ({selectedEvidence.length})
                                            </h3>
                                            {isLoadingDetails ? (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span className="text-xs">Loading...</span>
                                                </div>
                                            ) : selectedEvidence.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No evidence uploaded</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {selectedEvidence.map((ev) => {
                                                        const isImage = ev.mime_type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(ev.file_name)
                                                        return (
                                                            <div
                                                                key={ev.id}
                                                                className="bg-muted/30 rounded p-2 text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                                                                onClick={() => handleViewEvidence(ev)}
                                                            >
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium truncate flex-1">{ev.file_name}</span>
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">{ev.evidence_type}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Compact Meta Info */}
                                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-0.5">
                                            <p><span className="font-medium">ID:</span> <span className="font-mono">{selectedReport.id.slice(0, 8)}...</span></p>
                                            <p><span className="font-medium">Reporter:</span> {selectedReport.reporter_email}</p>
                                            <p><span className="font-medium">Submitted:</span> {new Date(selectedReport.created_at || "").toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border rounded-lg p-8 text-center">
                                    <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                    <p className="text-sm text-muted-foreground">Select a report to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Amendments View */}
                    {activeTab === "amendments" && (
                        <div className="grid lg:grid-cols-2 gap-4">
                            {/* Amendments List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-sm text-muted-foreground uppercase">Pending Amendments</h2>
                                    <Button size="sm" variant="outline" onClick={fetchData} disabled={isLoading} className="h-8 w-8 p-0">
                                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>

                                {isLoading ? (
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
                                ) : amendments.length === 0 ? (
                                    <div className="bg-card border rounded-lg p-6 text-center">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-muted-foreground">No pending amendments</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                                        {amendments.map((amendment) => {
                                            const typeInfo = AMENDMENT_TYPE_LABELS[amendment.amendment_type || ""] || { label: "Amendment", icon: "📝" }
                                            const isSelected = selectedAmendment?.id === amendment.id

                                            return (
                                                <div
                                                    key={amendment.id}
                                                    onClick={() => loadAmendmentDetails(amendment)}
                                                    className={`bg-card border rounded-lg p-3 cursor-pointer transition-all hover:border-secondary/50 ${
                                                        isSelected ? "border-secondary ring-1 ring-secondary/30 bg-secondary/5" : ""
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className="text-xl">{typeInfo.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-1.5">
                                                                <div>
                                                                    <h3 className="font-medium text-sm truncate">{typeInfo.label}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        For: {amendment.renter_name}
                                                                    </p>
                                                                </div>
                                                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border text-xs px-1.5 py-0 h-5 shrink-0">
                                                                    Pending
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                                <span>{new Date(amendment.created_at || "").toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                {amendment.evidence_count && amendment.evidence_count > 0 && (
                                                                    <span>{amendment.evidence_count} file{amendment.evidence_count !== 1 ? "s" : ""}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${isSelected ? "rotate-90" : ""}`} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Amendment Detail */}
                            <div className="lg:sticky lg:top-20">
                                {selectedAmendment ? (
                                    <div className="bg-card border rounded-lg overflow-hidden">
                                        {/* Header */}
                                        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="font-semibold text-sm truncate">
                                                    {AMENDMENT_TYPE_LABELS[selectedAmendment.amendment_type || ""]?.label || "Amendment"}
                                                </h2>
                                                <p className="text-xs text-muted-foreground">
                                                    For report: {selectedAmendment.renter_name}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedAmendment(null)} className="h-7 w-7 p-0">
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>

                                        <div className="p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                                            {/* Actions */}
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 border text-xs px-2 py-0 h-5">
                                                        Pending Review
                                                    </Badge>
                                                    
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAmendmentReview("APPROVED")}
                                                        disabled={isPending}
                                                        className="h-6 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setShowAmendmentRejectDialog(true)}
                                                        disabled={isPending}
                                                        className="h-6 text-xs px-2 gap-1"
                                                    >
                                                        <Ban className="w-3 h-3" />
                                                        Reject
                                                    </Button>
                                                </div>

                                                {actionError && (
                                                    <p className="text-xs text-destructive">{actionError}</p>
                                                )}

                                                {/* Reject Dialog */}
                                                {showAmendmentRejectDialog && (
                                                    <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded space-y-2">
                                                        <p className="text-xs font-medium">Rejection Reason</p>
                                                        <Textarea
                                                            value={amendmentRejectionReason}
                                                            onChange={(e) => setAmendmentRejectionReason(e.target.value)}
                                                            placeholder="Explain why this amendment is being rejected..."
                                                            className="text-xs h-16 resize-none"
                                                        />
                                                        <div className="flex gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleAmendmentReview("REJECTED")}
                                                                disabled={isPending || !amendmentRejectionReason.trim()}
                                                                className="h-7 text-xs"
                                                            >
                                                                Confirm Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setShowAmendmentRejectDialog(false)
                                                                    setAmendmentRejectionReason("")
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Changes Content */}
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Proposed Changes</h3>
                                                {(() => {
                                                    const changes = selectedAmendment.changes_json as {
                                                        additionalNotes?: string
                                                        phone?: string
                                                        email?: string
                                                        facebookLink?: string
                                                    } | null
                                                    
                                                    if (!changes) return <p className="text-xs text-muted-foreground">No details provided</p>
                                                    
                                                    return (
                                                        <div className="space-y-2 text-xs">
                                                            {changes.additionalNotes && (
                                                                <div className="bg-muted/30 rounded p-2">
                                                                    <p className="text-muted-foreground mb-1">Additional Info:</p>
                                                                    <p>{changes.additionalNotes}</p>
                                                                </div>
                                                            )}
                                                            {(changes.phone || changes.email || changes.facebookLink) && (
                                                                <div className="space-y-1">
                                                                    <p className="text-muted-foreground">New Identifiers:</p>
                                                                    {changes.phone && (
                                                                        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
                                                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                                                            <span>{changes.phone}</span>
                                                                        </div>
                                                                    )}
                                                                    {changes.email && (
                                                                        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
                                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                                            <span>{changes.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {changes.facebookLink && (
                                                                        <div className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1">
                                                                            <Facebook className="w-3 h-3 text-muted-foreground" />
                                                                            <a href={changes.facebookLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline flex items-center gap-1">
                                                                                View Profile <ExternalLink className="w-3 h-3" />
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </div>

                                            {/* Reporter Notes */}
                                            {selectedAmendment.reporter_notes && (
                                                <div>
                                                    <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">Reporter Notes</h3>
                                                    <p className="text-xs bg-muted/30 rounded p-2 italic">
                                                        "{selectedAmendment.reporter_notes}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Evidence */}
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-1.5 uppercase">
                                                    Evidence ({amendmentEvidence.length})
                                                </h3>
                                                {isLoadingAmendment ? (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span className="text-xs">Loading...</span>
                                                    </div>
                                                ) : amendmentEvidence.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">No evidence uploaded</p>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {amendmentEvidence.map((ev) => (
                                                            <div
                                                                key={ev.id}
                                                                className="bg-muted/30 rounded p-2 text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                                                                onClick={() => handleViewEvidence(ev)}
                                                            >
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium truncate flex-1">{ev.file_name}</span>
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">{ev.evidence_type}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta Info */}
                                            <div className="pt-2 border-t text-xs text-muted-foreground space-y-0.5">
                                                <p><span className="font-medium">Amendment ID:</span> <span className="font-mono">{selectedAmendment.id?.slice(0, 8)}...</span></p>
                                                <p><span className="font-medium">Report Status:</span> {selectedAmendment.report_status}</p>
                                                <p><span className="font-medium">Submitted:</span> {new Date(selectedAmendment.created_at || "").toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-card border rounded-lg p-8 text-center">
                                        <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-sm text-muted-foreground">Select an amendment to review</p>
                                    </div>
                                )}
                            </div>
                        </div>
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
