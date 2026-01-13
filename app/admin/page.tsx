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
} from "lucide-react"
import {
    checkIsAdmin,
    getAdminStats,
    getAllReports,
    getReportDetails,
    updateReportStatus,
    getAdminEvidenceUrl,
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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <Image src="/logos/rc-logo.svg" alt="RenterCheck" width={32} height={32} />
                                <span className="font-bold text-lg hidden sm:inline">RenterCheck</span>
                            </Link>
                            <div className="h-6 w-px bg-border hidden sm:block" />
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-secondary" />
                                <span className="text-sm font-medium">Admin Dashboard</span>
                                {adminRole && (
                                    <Badge variant="outline" className="text-xs">
                                        {adminRole}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Link href="/search">
                                <Button size="sm" variant="ghost" className="gap-2">
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Search</span>
                                </Button>
                            </Link>
                            {user && (
                                <Button size="sm" variant="ghost" onClick={handleLogout} disabled={isPending} className="gap-2">
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign out</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar / Stats */}
                <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Overview</h3>
                        <div className="space-y-3">
                            <div className="bg-card border rounded-lg p-4">
                                <div className="text-3xl font-bold text-amber-400">{stats?.pending_count || 0}</div>
                                <div className="text-sm text-muted-foreground">Pending Review</div>
                            </div>
                            <div className="bg-card border rounded-lg p-4">
                                <div className="text-3xl font-bold text-blue-400">{stats?.under_review_count || 0}</div>
                                <div className="text-sm text-muted-foreground">Under Review</div>
                            </div>
                            <div className="bg-card border rounded-lg p-4">
                                <div className="text-3xl font-bold text-emerald-400">{stats?.approved_count || 0}</div>
                                <div className="text-sm text-muted-foreground">Approved</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last 24h</span>
                                <span className="font-medium">{stats?.reports_last_24h || 0} reports</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last 7 days</span>
                                <span className="font-medium">{stats?.reports_last_7d || 0} reports</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Reporters</span>
                                <span className="font-medium">{stats?.unique_reporters || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Verified Renters</span>
                                <span className="font-medium">{stats?.verified_renters || 0}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {/* Mobile Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 lg:hidden">
                        <div className="bg-card border rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-amber-400">{stats?.pending_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="bg-card border rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-400">{stats?.under_review_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Reviewing</div>
                        </div>
                        <div className="bg-card border rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-emerald-400">{stats?.approved_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button size="sm" variant="outline" onClick={fetchData} disabled={isLoading} className="gap-2">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>

                        <span className="text-sm text-muted-foreground ml-auto">
                            {totalReports} report{totalReports !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <span className="text-destructive">{error}</span>
                        </div>
                    )}

                    {/* Reports Grid */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Reports List */}
                        <div className="space-y-4">
                            <h2 className="font-semibold text-lg">Reports Queue</h2>
                            
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-muted rounded w-1/2" />
                                                    <div className="h-3 bg-muted rounded w-1/3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="bg-card border rounded-lg p-8 text-center">
                                    <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No reports found</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                                    {reports.map((report) => {
                                        const status = report.status || "PENDING"
                                        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                                        const incidentInfo = INCIDENT_TYPE_LABELS[report.incident_type] || { label: report.incident_type, icon: "📋" }
                                        const isSelected = selectedReport?.id === report.id

                                        return (
                                            <div
                                                key={report.id}
                                                onClick={() => loadReportDetails(report)}
                                                className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:border-secondary/50 ${
                                                    isSelected ? "border-secondary ring-1 ring-secondary/30" : ""
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="text-2xl">{incidentInfo.icon}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-medium truncate">{report.reported_full_name}</h3>
                                                                <p className="text-xs text-muted-foreground">{incidentInfo.label}</p>
                                                            </div>
                                                            <Badge className={`${config.color} border text-xs shrink-0`}>
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                            <span>{new Date(report.incident_date).toLocaleDateString()}</span>
                                                            {report.amount_involved && (
                                                                <span>₱{report.amount_involved.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Report Detail */}
                        <div className="lg:sticky lg:top-24">
                            {selectedReport ? (
                                <div className="bg-card border rounded-xl overflow-hidden">
                                    {/* Header */}
                                    <div className="p-4 border-b bg-muted/30">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="font-semibold text-lg">{selectedReport.reported_full_name}</h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {INCIDENT_TYPE_LABELS[selectedReport.incident_type]?.label || selectedReport.incident_type}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedReport(null)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={`${STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.color || ""} border`}>
                                                {STATUS_CONFIG[selectedReport.status as keyof typeof STATUS_CONFIG]?.label || selectedReport.status}
                                            </Badge>
                                            
                                            {selectedReport.status === "PENDING" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusChange("UNDER_REVIEW")}
                                                    disabled={isPending}
                                                    className="gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Start Review
                                                </Button>
                                            )}
                                            
                                            {(selectedReport.status === "PENDING" || selectedReport.status === "UNDER_REVIEW") && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStatusChange("APPROVED")}
                                                        disabled={isPending}
                                                        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setShowRejectDialog(true)}
                                                        disabled={isPending}
                                                        className="gap-1"
                                                    >
                                                        <Ban className="w-3 h-3" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        {actionError && (
                                            <p className="text-sm text-destructive">{actionError}</p>
                                        )}

                                        {/* Reject Dialog */}
                                        {showRejectDialog && (
                                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg space-y-3">
                                                <p className="text-sm font-medium">Rejection Reason</p>
                                                <Textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Explain why this report is being rejected..."
                                                    className="text-sm"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleStatusChange("REJECTED")}
                                                        disabled={isPending || !rejectionReason.trim()}
                                                    >
                                                        Confirm Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setShowRejectDialog(false)
                                                            setRejectionReason("")
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Renter Info */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Renter Information</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{selectedReport.reported_full_name}</span>
                                                </div>
                                                {selectedReport.reported_phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                                        <span>{selectedReport.reported_phone}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => copyToClipboard(selectedReport.reported_phone!)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {selectedReport.reported_email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                                        <span>{selectedReport.reported_email}</span>
                                                    </div>
                                                )}
                                                {selectedReport.reported_facebook && (
                                                    <div className="flex items-center gap-2">
                                                        <Facebook className="w-4 h-4 text-muted-foreground" />
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
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                                        <span>{selectedReport.reported_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Incident Details */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Incident Details</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span>{new Date(selectedReport.incident_date).toLocaleDateString()}</span>
                                                </div>
                                                {selectedReport.amount_involved && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                        <span>₱{selectedReport.amount_involved.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {(selectedReport.incident_region || selectedReport.incident_city) && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                        <span>
                                                            {[selectedReport.incident_city, selectedReport.incident_region].filter(Boolean).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
                                            <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedReport.summary}</p>
                                        </div>

                                        {/* Evidence */}
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                                Evidence ({selectedEvidence.length})
                                            </h3>
                                            {isLoadingDetails ? (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">Loading evidence...</span>
                                                </div>
                                            ) : selectedEvidence.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No evidence uploaded</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedEvidence.map((ev) => (
                                                        <div
                                                            key={ev.id}
                                                            className="bg-muted/30 rounded-lg p-2 text-xs cursor-pointer hover:bg-muted/50"
                                                            onClick={() => loadEvidenceUrl(ev)}
                                                        >
                                                            <div className="font-medium truncate">{ev.file_name}</div>
                                                            <div className="text-muted-foreground">{ev.evidence_type}</div>
                                                            {evidenceUrls[ev.id] && (
                                                                <a
                                                                    href={evidenceUrls[ev.id]}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-secondary hover:underline flex items-center gap-1 mt-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    View <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta Info */}
                                        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                                            <p>Report ID: <span className="font-mono">{selectedReport.id}</span></p>
                                            <p>Reporter: {selectedReport.reporter_email}</p>
                                            <p>Submitted: {new Date(selectedReport.created_at || "").toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card border rounded-xl p-8 text-center">
                                    <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">Select a report to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
