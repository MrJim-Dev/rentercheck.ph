"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { Database } from "@/lib/database.types"
import {
    AlertTriangle,
    Ban,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    Edit,
    Eye,
    FileText,
    History,
    MapPin,
    MoreVertical,
    Repeat,
    Trash2,
    User,
    XCircle,
} from "lucide-react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]

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

interface ReportsTableProps {
    reports: Report[]
    isLoading: boolean
    onViewDetails: (report: Report) => void
    onApprove?: (report: Report) => void
    onReject?: (report: Report) => void
    onTransfer?: (report: Report) => void
    onEdit?: (report: Report) => void
    onViewHistory?: (report: Report) => void
    onHardDelete?: (report: Report) => void
}

export function ReportsTable({ 
    reports, 
    isLoading, 
    onViewDetails,
    onApprove,
    onReject,
    onTransfer,
    onEdit,
    onViewHistory,
    onHardDelete,
}: ReportsTableProps) {
    if (isLoading) {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[140px]">Status</TableHead>
                            <TableHead>Renter Name</TableHead>
                            <TableHead>Incident Type</TableHead>
                            <TableHead className="w-[140px]">Date</TableHead>
                            <TableHead className="w-[120px]">Amount</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                                </TableCell>
                                <TableCell>
                                    <div className="h-8 w-20 bg-muted rounded animate-pulse ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="rounded-md border">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead>Renter Name</TableHead>
                        <TableHead>Incident Type</TableHead>
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => {
                        const status = report.status || "PENDING"
                        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                        const incidentInfo = INCIDENT_TYPE_LABELS[report.incident_type] || { label: report.incident_type, icon: "📋" }
                        const StatusIcon = config.icon

                        return (
                            <TableRow
                                key={report.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onViewDetails(report)}
                            >
                                <TableCell>
                                    <Badge className={`${config.color} border text-xs px-2 py-1 flex items-center gap-1.5 w-fit`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">{report.reported_full_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{incidentInfo.icon}</span>
                                        <span className="text-sm">{incidentInfo.label}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(report.incident_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {report.amount_involved ? (
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                                            ₱{report.amount_involved.toLocaleString()}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {(report.incident_city || report.incident_region) ? (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[200px]">
                                                {[report.incident_city, report.incident_region].filter(Boolean).join(", ")}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onViewDetails(report)
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>
                                            {(report.status === "PENDING" || report.status === "UNDER_REVIEW") && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onApprove?.(report)
                                                        }}
                                                        className="text-emerald-600"
                                                    >
                                                        <Check className="w-4 h-4 mr-2" />
                                                        Approve Report
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onReject?.(report)
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Ban className="w-4 h-4 mr-2" />
                                                        Reject Report
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onTransfer?.(report)
                                                }}
                                            >
                                                <Repeat className="w-4 h-4 mr-2" />
                                                Transfer Report
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onEdit?.(report)
                                                }}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Report
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onViewHistory?.(report)
                                                }}
                                            >
                                                <History className="w-4 h-4 mr-2" />
                                                View History
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onHardDelete?.(report)
                                                }}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Hard Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
