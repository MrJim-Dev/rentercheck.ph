"use client"

import {
    checkIsAdmin,
    getAdminEvidenceUrl,
    getAdminStats,
    getAllReports,
    getReportDetails,
    getReportEditHistory,
    hardDeleteReport,
    transferReport,
    updateReportDetails,
    updateReportStatus
} from "@/app/actions/admin"
import { logout } from "@/app/actions/auth"
import { removeReportFromGroup } from "@/app/actions/report-merge"
import { AdminUserCreditTable } from "@/components/admin/admin-user-credit-table"
import { CreditConfigTable } from "@/components/admin/credit-config-table"
import { DisputesTable } from "@/components/admin/disputes-table"
import { MergeReportsDialog } from "@/components/admin/merge-reports-dialog"
import { ReportDetailsSheet } from "@/components/admin/report-details-sheet"
import { ReportEditorDialog } from "@/components/admin/report-editor-dialog"
import { ReportHistoryDialog } from "@/components/admin/report-history-dialog"
import { ReportsTable } from "@/components/admin/reports-table"
import { TransferReportDialog } from "@/components/admin/transfer-report-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { useToast } from "@/components/ui/use-toast"
import { signOutClient, useAuth } from "@/lib/auth/auth-provider"
import type { Database, Enums } from "@/lib/database.types"
import {
    AlertTriangle,
    Home,
    Loader2,
    LogOut,
    RefreshCw,
    Search,
    Shield,
    Trash2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState, useTransition } from "react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"] & {
    report_group_members?: { group_id: string }[] | { group_id: string } | null | any
}
type Evidence = Database["public"]["Tables"]["report_evidence"]["Row"]

function AdminPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()
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

    // File viewer state
    const [fileViewer, setFileViewer] = useState<{ open: boolean; url: string; name: string; type?: string }>({
        open: false,
        url: "",
        name: "",
    })

    // Edit dialog state
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [reportToEdit, setReportToEdit] = useState<Report | null>(null)

    // History dialog state
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [reportForHistory, setReportForHistory] = useState<Report | null>(null)

    // Hard delete dialog state
    const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false)
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
    const [hardDeleteReason, setHardDeleteReason] = useState("")

    // Transfer dialog state
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [reportToTransfer, setReportToTransfer] = useState<Report | null>(null)

    // Merge dialog state
    const [showMergeDialog, setShowMergeDialog] = useState(false)
    const [reportToMerge, setReportToMerge] = useState<Report | null>(null)

    // Unmerge dialog state
    const [showUnmergeDialog, setShowUnmergeDialog] = useState(false)
    const [reportToUnmerge, setReportToUnmerge] = useState<Report | null>(null)

    // Group reports state for details view
    const [selectedGroupReports, setSelectedGroupReports] = useState<any[] | undefined>(undefined)

    const { user, loading: authLoading } = useAuth()

    // Function to change tab and update URL
    const changeTab = (newView: "REPORTS" | "CONFIG" | "USERS" | "DISPUTES") => {
        setView(newView)
        router.push(`/admin?tab=${newView.toLowerCase()}`)
    }

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
                router.push("/login?returnTo=/admin")
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

    useEffect(() => {
        if (!isAdmin) return

        setIsLoading(true)
        setError(null)

        const loadData = async () => {
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

        const timer = setTimeout(() => {
            loadData()
        }, searchQuery ? 300 : 0)

        return () => clearTimeout(timer)
    }, [isAdmin, statusFilter, searchQuery])

    // Fetch data function for other uses
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

    // Load report details
    const loadReportDetails = async (report: Report) => {
        setSelectedReport(report)
        setIsLoadingDetails(true)
        setSelectedEvidence([])
        setSelectedGroupReports(undefined)

        const result = await getReportDetails(report.id)
        if (result.success && result.data) {
            setSelectedEvidence(result.data.evidence)
            if (result.data.groupReports) {
                setSelectedGroupReports(result.data.groupReports)
            }
        }
        setIsLoadingDetails(false)
    }

    // Handle status change
    const handleDetailStatusChange = async (report: Report, newStatus: Enums<"report_status">, reason?: string) => {
        const reportId = report.id

        // Optimistically update local state
        if (selectedReport && selectedReport.id === reportId) {
            setSelectedReport({ ...selectedReport, status: newStatus })
        } else if (selectedGroupReports) {
            // Check if it's in group reports
            setSelectedGroupReports(prev => prev?.map(g =>
                g.report.id === reportId ? { ...g, report: { ...g.report, status: newStatus } } : g
            ))
        }

        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, status: newStatus } : r
        ))

        // Sync with server in background
        startTransition(async () => {
            const result = await updateReportStatus(
                reportId,
                newStatus,
                undefined,
                reason
            )

            if (!result.success) {
                // Rollback on failure - refetch to get correct state
                const reportsResult = await getAllReports({
                    status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                })
                if (reportsResult.success && reportsResult.data) {
                    setReports(reportsResult.data.reports)
                    // Reload details if this report is viewing
                    if (selectedReport && (selectedReport.id === reportId || selectedGroupReports?.some(g => g.report.id === reportId))) {
                        loadReportDetails(selectedReport)
                    }
                }
            }
        })
    }

    // Remove unused functions
    // const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({})

    // Handle hard delete
    const handleHardDelete = async () => {
        if (!reportToDelete) return

        const reportIdToDelete = reportToDelete.id

        // Optimistically remove from UI immediately
        setReports(prevReports => prevReports.filter(r => r.id !== reportIdToDelete))
        setTotalReports(prev => Math.max(0, prev - 1))

        // Close dialog and reset state
        setShowHardDeleteDialog(false)
        setHardDeleteReason("")
        setReportToDelete(null)
        if (selectedReport?.id === reportIdToDelete) {
            setSelectedReport(null)
        }

        // Sync with server in background
        startTransition(async () => {
            const result = await hardDeleteReport(reportIdToDelete, hardDeleteReason || "Spam/Duplicate report")

            if (!result.success) {
                // Rollback on failure - refetch to get correct state
                const reportsResult = await getAllReports({
                    status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                })
                if (reportsResult.success && reportsResult.data) {
                    setReports(reportsResult.data.reports)
                    setTotalReports(reportsResult.data.total)
                }
            }
        })
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
        if (!reportToEdit) return

        const reportId = reportToEdit.id

        // Optimistically update local state
        const updatedReport = { ...reportToEdit, ...updates }
        setReports(prev => prev.map(r =>
            r.id === reportId ? updatedReport : r
        ))
        if (selectedReport?.id === reportId) {
            setSelectedReport(updatedReport)
        }

        setShowEditDialog(false)
        setReportToEdit(null)

        // Sync with server in background
        const result = await updateReportDetails(reportId, updates, changeNote)
        if (!result.success) {
            alert(result.error || "Failed to update report")
            // Rollback on failure - refetch to get correct state
            const reportsResult = await getAllReports({
                status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                search: searchQuery || undefined,
                limit: 50,
            })
            if (reportsResult.success && reportsResult.data) {
                setReports(reportsResult.data.reports)
                const report = reportsResult.data.reports.find(r => r.id === reportId)
                if (report && selectedReport?.id === reportId) {
                    setSelectedReport(report)
                }
            }
        } else {
            // Refresh the details if it's open for the same report
            if (selectedReport?.id === reportId) {
                await loadReportDetails(updatedReport)
            }
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

    // Handle transfer report
    const handleTransferReport = async (newUserId: string, reason: string) => {
        if (!reportToTransfer) return

        const reportId = reportToTransfer.id

        // Optimistically update local state
        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, user_id: newUserId } : r
        ))
        if (selectedReport?.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, user_id: newUserId } : null)
        }

        setShowTransferDialog(false)
        setReportToTransfer(null)

        // Sync with server in background
        startTransition(async () => {
            const result = await transferReport(reportId, newUserId, reason)

            if (!result.success) {
                alert(result.error || "Failed to transfer report")
                // Rollback on failure - refetch to get correct state
                const reportsResult = await getAllReports({
                    status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                })
                if (reportsResult.success && reportsResult.data) {
                    setReports(reportsResult.data.reports)
                    const report = reportsResult.data.reports.find(r => r.id === reportId)
                    if (report && selectedReport?.id === reportId) {
                        setSelectedReport(report)
                    }
                }
            }
        })
    }

    // Quick action handlers for table
    const handleQuickApprove = async (report: Report) => {
        const reportId = report.id

        // Optimistically update local state
        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, status: "APPROVED" } : r
        ))
        if (selectedReport?.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, status: "APPROVED" } : null)
        }

        // Sync with server in background
        startTransition(async () => {
            const result = await updateReportStatus(
                reportId,
                "APPROVED"
            )

            if (!result.success) {
                // Rollback on failure - refetch to get correct state
                const reportsResult = await getAllReports({
                    status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                })
                if (reportsResult.success && reportsResult.data) {
                    setReports(reportsResult.data.reports)
                    const reportData = reportsResult.data.reports.find(r => r.id === reportId)
                    if (reportData && selectedReport?.id === reportId) {
                        setSelectedReport(reportData)
                    }
                }
            }
        })
    }

    const handleQuickReject = async (report: Report) => {
        const reportId = report.id

        // Optimistically update local state
        setReports(prev => prev.map(r =>
            r.id === reportId ? { ...r, status: "REJECTED" } : r
        ))
        if (selectedReport?.id === reportId) {
            setSelectedReport(prev => prev ? { ...prev, status: "REJECTED" } : null)
        }

        // Sync with server in background
        startTransition(async () => {
            const result = await updateReportStatus(
                reportId,
                "REJECTED"
            )

            if (!result.success) {
                // Rollback on failure - refetch to get correct state
                const reportsResult = await getAllReports({
                    status: statusFilter !== "ALL" ? statusFilter as Enums<"report_status"> : undefined,
                    search: searchQuery || undefined,
                    limit: 50,
                })
                if (reportsResult.success && reportsResult.data) {
                    setReports(reportsResult.data.reports)
                    const reportData = reportsResult.data.reports.find(r => r.id === reportId)
                    if (reportData && selectedReport?.id === reportId) {
                        setSelectedReport(reportData)
                    }
                }
            }
        })
    }

    const handleQuickTransfer = (report: Report) => {
        setReportToTransfer(report)
        setShowTransferDialog(true)
    }

    const handleQuickEdit = (report: Report) => {
        router.push(`/report?id=${report.id}`)
    }

    const handleQuickViewHistory = (report: Report) => {
        setReportForHistory(report)
        setShowHistoryDialog(true)
    }

    const handleQuickHardDelete = (report: Report) => {
        setReportToDelete(report)
        setShowHardDeleteDialog(true)
    }

    const handleQuickMerge = (report: Report) => {
        setReportToMerge(report)
        setShowMergeDialog(true)
    }

    const handleQuickUnmerge = (report: Report) => {
        setReportToUnmerge(report)
        setShowUnmergeDialog(true)
    }

    const handleUnmergeConfirm = async () => {
        if (!reportToUnmerge) return

        const reportId = reportToUnmerge.id

        // Close dialog immediately
        setShowUnmergeDialog(false)
        setReportToUnmerge(null)

        try {
            const result = await removeReportFromGroup(reportId)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Report unmerged successfully"
                })
                // Delay refresh slightly to allow toast to render
                setTimeout(() => {
                    fetchData()
                    router.refresh()

                    // If we are looking at this report details, reload them
                    if (selectedReport?.id === reportId) {
                        // We need to fetch fresh details
                        getReportDetails(reportId).then((updated) => {
                            if (updated.success && updated.data) {
                                setSelectedReport(updated.data.report)
                                setSelectedEvidence(updated.data.evidence)
                                setSelectedGroupReports(updated.data.groupReports)
                            }
                        })
                    }
                }, 500)
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to unmerge report"
                })
                // Revert
                fetchData() // Simple revert by fetching fresh data
            }
        } catch (error) {
            console.error("Error unmerging:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            })
        }
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
                        You don&apos;t have permission to access the admin dashboard.
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
                                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                                    <span className="text-destructive text-sm">{error}</span>
                                </div>
                            )}

                            {/* Reports Table */}
                            <ReportsTable
                                reports={reports}
                                isLoading={isLoading}
                                onViewDetails={loadReportDetails}
                                onApprove={handleQuickApprove}
                                onReject={handleQuickReject}
                                onTransfer={handleQuickTransfer}
                                onEdit={handleQuickEdit}
                                onViewHistory={handleQuickViewHistory}
                                onHardDelete={handleQuickHardDelete}
                                onMerge={handleQuickMerge}
                                onUnmerge={handleQuickUnmerge}
                            />
                        </>
                    )}

                    {/* Report Details Sheet */}
                    {selectedReport && !showTransferDialog && (
                        <ReportDetailsSheet
                            report={selectedReport}
                            evidence={selectedEvidence}
                            groupReports={selectedGroupReports}
                            isOpen={!!selectedReport && !showTransferDialog}
                            isLoadingDetails={isLoadingDetails}
                            isPending={isPending}
                            onClose={() => setSelectedReport(null)}
                            onStatusChange={handleDetailStatusChange}
                            onViewEvidence={handleViewEvidence}
                            onEdit={(report) => {
                                router.push(`/report?id=${report.id}`)
                            }}
                            onViewHistory={(report) => {
                                setReportForHistory(report)
                                setShowHistoryDialog(true)
                            }}
                            onHardDelete={(report) => {
                                setReportToDelete(report)
                                setShowHardDeleteDialog(true)
                            }}
                        />
                    )}

                    {/* Dialogs */}
                    <FileViewerDialog
                        open={fileViewer.open}
                        onOpenChange={(open) => setFileViewer({ ...fileViewer, open })}
                        fileUrl={fileViewer.url}
                        fileName={fileViewer.name}
                        fileType={fileViewer.type}
                    />

                    {/* Unmerge Confirmation Dialog */}
                    <AlertDialog open={showUnmergeDialog} onOpenChange={setShowUnmergeDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Unmerge Report?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove this report from its group? It will appear as a standalone report again.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnmergeConfirm} className="bg-orange-600 hover:bg-orange-700">
                                    Unmerge Report
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {reportToEdit && (
                        <ReportEditorDialog
                            open={showEditDialog}
                            onOpenChange={(open) => {
                                setShowEditDialog(open)
                                if (!open) setReportToEdit(null)
                            }}
                            report={reportToEdit}
                            onSave={handleEditReport}
                        />
                    )}

                    {/* History Dialog - Independent */}
                    {reportForHistory && (
                        <ReportHistoryDialog
                            open={showHistoryDialog}
                            onOpenChange={(open) => {
                                setShowHistoryDialog(open)
                                if (!open) setReportForHistory(null)
                            }}
                            reportId={reportForHistory.id}
                            onLoadHistory={handleLoadHistory}
                        />
                    )}

                    {/* Hard Delete Dialog - Independent */}
                    {reportToDelete && (
                        <AlertDialog
                            open={showHardDeleteDialog}
                            onOpenChange={(open) => {
                                setShowHardDeleteDialog(open)
                                if (!open) {
                                    setReportToDelete(null)
                                    setHardDeleteReason("")
                                }
                            }}
                        >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                                        <AlertTriangle className="w-5 h-5" />
                                        Permanently Delete Report?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3">
                                        <p>
                                            This action cannot be undone. This will permanently delete the report and all associated data including:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>All evidence files</li>
                                            <li>All identifiers</li>
                                            <li>Edit history</li>
                                            <li>Disputes</li>
                                        </ul>
                                        <p className="text-sm font-medium text-foreground">
                                            Report: <span className="font-mono">{reportToDelete.reported_full_name}</span>
                                        </p>
                                        <div className="pt-2">
                                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                                Reason for deletion (optional):
                                            </label>
                                            <Textarea
                                                value={hardDeleteReason}
                                                onChange={(e) => setHardDeleteReason(e.target.value)}
                                                placeholder="e.g., Duplicate report, Spam, etc."
                                                className="text-xs min-h-15 resize-none"
                                            />
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleHardDelete()
                                        }}
                                        disabled={isPending}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                Delete Permanently
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Transfer Report Dialog - Independent */}
                    <TransferReportDialog
                        report={reportToTransfer}
                        isOpen={showTransferDialog}
                        isPending={isPending}
                        onClose={() => {
                            setShowTransferDialog(false)
                            setReportToTransfer(null)
                        }}
                        onConfirm={handleTransferReport}
                    />

                    {/* Merge Reports Dialog - Independent */}
                    {reportToMerge && (
                        <MergeReportsDialog
                            open={showMergeDialog}
                            onOpenChange={(open) => {
                                setShowMergeDialog(open)
                                if (!open) setReportToMerge(null)
                            }}
                            preSelectedReport={reportToMerge}
                            availableReports={reports.filter(r => r.status === "APPROVED")}
                            onSuccess={() => {
                                setTimeout(() => {
                                    fetchData()
                                    router.refresh()
                                }, 500)
                            }}
                        />
                    )}
                </main>
            </div>
        </div>
    )
}
export default function AdminPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <AdminPageContent />
        </Suspense>
    )
}