"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Database, Enums } from "@/lib/database.types"
import {
    AlertTriangle,
    Ban,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    DollarSign,
    Edit,
    ExternalLink,
    Eye,
    Facebook,
    FileText,
    History,
    ImageIcon,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Trash2,
    User,
    XCircle
} from "lucide-react"
import { useEffect, useState } from "react"
// ... imports

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

interface ReportDetailsSheetProps {
    report: Report | null
    evidence: Evidence[]
    groupReports?: { report: Report; evidence: Evidence[] }[]
    isOpen: boolean
    isLoadingDetails: boolean
    isPending: boolean
    onClose: () => void
    onStatusChange: (report: Report, status: Enums<"report_status">, reason?: string) => void
    onViewEvidence: (evidence: Evidence) => void
    onEdit: (report: Report) => void
    onViewHistory: (report: Report) => void
    onHardDelete: (report: Report) => void
}

export function ReportDetailsSheet({
    report,
    evidence,
    groupReports,
    isOpen,
    isLoadingDetails,
    isPending,
    onClose,
    onStatusChange,
    onViewEvidence,
    onEdit,
    onViewHistory,
    onHardDelete,
}: ReportDetailsSheetProps) {
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [actionError, setActionError] = useState<string | null>(null)

    // State to track which report in the group is being viewed
    // Default to the main report passed
    const [activeReportId, setActiveReportId] = useState<string>("")

    useEffect(() => {
        if (report) {
            setActiveReportId(report.id)
        }
    }, [report])

    if (!report) return null

    // Determine which report to show
    let currentReport = report
    let currentEvidence = evidence

    // If we have group reports, look up the selected one
    if (groupReports && groupReports.length > 0) {
        const found = groupReports.find(g => g.report.id === activeReportId)
        if (found) {
            currentReport = found.report
            currentEvidence = found.evidence
        }
    }

    const status = currentReport.status || "PENDING"
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
    const incidentInfo = INCIDENT_TYPE_LABELS[currentReport.incident_type] || { label: currentReport.incident_type, icon: "📋" }
    const StatusIcon = config.icon

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            setActionError("Please provide a rejection reason")
            return
        }
        setActionError(null)
        onStatusChange(currentReport, "REJECTED", rejectionReason)
        setShowRejectDialog(false)
        setRejectionReason("")
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.color} border`}>
                            <span className="text-2xl">{incidentInfo.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-xl font-semibold mb-1">
                                {currentReport.reported_full_name}
                            </SheetTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${config.color} border text-xs px-2 py-1 flex items-center gap-1.5`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {config.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{incidentInfo.label}</span>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    {groupReports && groupReports.length > 0 && (
                        <div className="pt-6 pb-2">
                            <Tabs value={activeReportId} onValueChange={setActiveReportId} className="w-full">
                                <TabsList className="w-full justify-start overflow-x-auto">
                                    {groupReports.map((item, idx) => (
                                        <TabsTrigger key={item.report.id} value={item.report.id}>
                                            Report {idx + 1} ({new Date(item.report.incident_date).toLocaleDateString()})
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                    <div className="space-y-6 py-6">
                        {/* Quick Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incident Date</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {new Date(currentReport.incident_date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                            {currentReport.amount_involved && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount Involved</p>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        ₱{currentReport.amount_involved.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Report ID */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Report ID</p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{currentReport.id}</code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => copyToClipboard(currentReport.id)}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium uppercase tracking-wide">Quick Actions</h3>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onEdit(currentReport)}
                                        className="h-8 px-2 gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onViewHistory(currentReport)}
                                        className="h-8 px-2 gap-1.5"
                                    >
                                        <History className="w-3.5 h-3.5" />
                                        History
                                    </Button>
                                </div>
                            </div>

                            {/* Status Actions */}
                            <div className="flex flex-wrap gap-2">
                                {currentReport.status === "PENDING" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onStatusChange(currentReport, "UNDER_REVIEW")}
                                        disabled={isPending}
                                        className="h-9"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Mark for Review
                                    </Button>
                                )}
                                {(currentReport.status === "PENDING" || currentReport.status === "UNDER_REVIEW") && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => onStatusChange(currentReport, "APPROVED")}
                                            disabled={isPending}
                                            className="h-9 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Approve Report
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={isPending}
                                            className="h-9"
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Reject Report
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onHardDelete(currentReport)}
                                    disabled={isPending}
                                    className="h-9 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Hard Delete
                                </Button>
                            </div>

                            {actionError && (
                                <p className="text-xs text-destructive">{actionError}</p>
                            )}

                            {/* Rejection Dialog */}
                            {showRejectDialog && (
                                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-in fade-in zoom-in-95 duration-200 space-y-3">
                                    <div>
                                        <p className="text-sm font-medium mb-1">Reason for Rejection</p>
                                        <p className="text-xs text-muted-foreground">Explain why this report is being rejected</p>
                                    </div>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Provide a clear reason for rejection..."
                                        className="text-sm min-h-[100px] resize-none bg-background"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowRejectDialog(false)
                                                setRejectionReason("")
                                                setActionError(null)
                                            }}
                                            className="h-8"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleReject}
                                            disabled={isPending || !rejectionReason.trim()}
                                            className="h-8"
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                    Rejecting...
                                                </>
                                            ) : (
                                                "Confirm Rejection"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Renter Information */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium uppercase tracking-wide">Renter Information</h3>
                            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Full Name</p>
                                        <p className="text-sm font-medium">{currentReport.reported_full_name}</p>
                                    </div>
                                </div>
                                {currentReport.reported_date_of_birth && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date of Birth</p>
                                            <p className="text-sm font-medium">{new Date(currentReport.reported_date_of_birth).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}</p>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="text-sm font-mono">{currentReport.reported_phone}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => copyToClipboard(currentReport.reported_phone!)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                                {currentReport.reported_phones && Array.isArray(currentReport.reported_phones) && (currentReport.reported_phones as string[]).length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Additional Phones</p>
                                            <div className="space-y-1">
                                                {(currentReport.reported_phones as string[]).map((phone, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <p className="text-sm font-mono">{phone}</p>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => copyToClipboard(phone)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="text-sm">{currentReport.reported_email}</p>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_emails && Array.isArray(currentReport.reported_emails) && (currentReport.reported_emails as string[]).length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Additional Emails</p>
                                            <div className="space-y-1">
                                                {(currentReport.reported_emails as string[]).map((email, idx) => (
                                                    <p key={idx} className="text-sm">{email}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_facebook && (
                                    <div className="flex items-center gap-3">
                                        <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Facebook</p>
                                            <a
                                                href={currentReport.reported_facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-secondary hover:underline flex items-center gap-1"
                                            >
                                                View Profile
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_facebooks && Array.isArray(currentReport.reported_facebooks) && (currentReport.reported_facebooks as string[]).length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Additional Facebook Profiles</p>
                                            <div className="space-y-1">
                                                {(currentReport.reported_facebooks as string[]).map((fb, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={fb}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-secondary hover:underline flex items-center gap-1"
                                                    >
                                                        View Profile {idx + 1}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_aliases && Array.isArray(currentReport.reported_aliases) && (currentReport.reported_aliases as string[]).length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Known Aliases</p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {(currentReport.reported_aliases as string[]).map((alias, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {alias}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentReport.reported_address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Address</p>
                                            <p className="text-sm">{currentReport.reported_address}</p>
                                        </div>
                                    </div>
                                )}
                                {(currentReport.reported_city || currentReport.incident_region) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">City/Region</p>
                                            <p className="text-sm">
                                                {[currentReport.reported_city, currentReport.incident_region].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Rental Information */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium uppercase tracking-wide">Rental Information</h3>
                            <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                                {currentReport.rental_category && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Rental Category</p>
                                            <p className="text-sm font-medium">
                                                {currentReport.rental_category.split('_').map(word =>
                                                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                                                ).join(' ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {currentReport.rental_item_description && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Item Description</p>
                                            <p className="text-sm">{currentReport.rental_item_description}</p>
                                        </div>
                                    </div>
                                )}
                                {(currentReport.incident_city || currentReport.incident_region) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Incident Location</p>
                                            <p className="text-sm">
                                                {[currentReport.incident_city, currentReport.incident_region].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {currentReport.incident_place && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Specific Place</p>
                                            <p className="text-sm">{currentReport.incident_place}</p>
                                        </div>
                                    </div>
                                )}
                                {currentReport.incident_end_date && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Incident End Date</p>
                                            <p className="text-sm">{new Date(currentReport.incident_end_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Incident Summary */}
                        {currentReport.summary && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium uppercase tracking-wide">Incident Summary</h3>
                                <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                                    {currentReport.summary}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Evidence */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium uppercase tracking-wide">Evidence</h3>
                                {currentEvidence.length > 0 && (
                                    <Badge variant="secondary" className="px-2 h-6 text-xs">
                                        {currentEvidence.length} {currentEvidence.length === 1 ? "file" : "files"}
                                    </Badge>
                                )}
                            </div>

                            {isLoadingDetails && currentEvidence.length === 0 ? (
                                <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border-dashed border">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : currentEvidence.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg p-6 text-center border-dashed border">
                                    No evidence attached to this report
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {currentEvidence.map((ev) => (
                                        <div
                                            key={ev.id}
                                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group border"
                                            onClick={() => onViewEvidence(ev)}
                                        >
                                            <div className="w-10 h-10 rounded bg-background flex items-center justify-center flex-shrink-0">
                                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{ev.file_name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{ev.evidence_type}</p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-secondary opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Report Meta */}
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Submitted by:</span>
                                <span className="font-medium text-foreground">{currentReport.reporter_email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="font-medium text-foreground">
                                    {new Date(currentReport.created_at || "").toLocaleString()}
                                </span>
                            </div>
                            {currentReport.updated_at && (
                                <div className="flex justify-between">
                                    <span>Last Updated:</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(currentReport.updated_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
