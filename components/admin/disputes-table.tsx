"use client"

import { getAdminEvidenceUrl } from "@/app/actions/admin"
import { getAdminDisputes } from "@/app/actions/admin-disputes"
import { resolveDispute } from "@/app/actions/disputes"
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
import { Card } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileViewerDialog } from "@/components/ui/file-viewer-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Check, ExternalLink, FileText, Image as ImageIcon, MoreVertical, X } from "lucide-react"
import { useEffect, useState } from "react"

interface Dispute {
    id: string
    report_id: string
    disputer_id: string
    category: string
    reason: string
    status: 'OPEN' | 'APPROVED' | 'REJECTED'
    created_at: string
    evidence: Array<{
        id: string
        file_name: string
        mime_type: string
        storage_path: string
    }>
    report: {
        id: string
        reported_full_name: string
        incident_type: string
    } | null
    disputer: {
        email: string
    } | null
}

export function DisputesTable() {
    const { toast } = useToast()
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewFileUrl, setViewFileUrl] = useState<string | null>(null)
    const [viewFileType, setViewFileType] = useState<string>("")
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        type: 'APPROVED' | 'REJECTED' | null
        disputeId: string | null
        reportId: string | null
    }>({
        open: false,
        type: null,
        disputeId: null,
        reportId: null
    })

    const fetchDisputes = async () => {
        setIsLoading(true)
        const result = await getAdminDisputes()

        if (result.success && result.data) {
            setDisputes(result.data)
        } else {
            console.error("Failed to fetch disputes:", result.error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchDisputes()
    }, [])

    const handleResolve = (disputeId: string, decision: 'APPROVED' | 'REJECTED', reportId: string) => {
        setConfirmDialog({
            open: true,
            type: decision,
            disputeId,
            reportId
        })
    }


    const processResolution = async () => {
        if (!confirmDialog.disputeId || !confirmDialog.reportId || !confirmDialog.type) return

        setIsLoading(true)
        try {
            const result = await resolveDispute(confirmDialog.disputeId, confirmDialog.type, confirmDialog.reportId)

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Dispute ${confirmDialog.type.toLowerCase()} successfully`,
                    variant: "default",
                })

                // Optimistic Update
                setDisputes(prev => prev.map(d =>
                    d.id === confirmDialog.disputeId
                        ? { ...d, status: confirmDialog.type as 'APPROVED' | 'REJECTED' }
                        : d
                ))

                // Fetch fresh data in background
                fetchDisputes()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update dispute",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error resolving dispute:", error)
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
            setConfirmDialog({ open: false, type: null, disputeId: null, reportId: null })
        }
    }

    const handleViewEvidence = async (path: string, type: string) => {
        const result = await getAdminEvidenceUrl(path)
        if (result.success && result.data) {
            setViewFileUrl(result.data.url)
            setViewFileType(type)
        } else {
            alert("Could not load file")
        }
    }

    if (isLoading) return <div className="p-4 text-center">Loading disputes...</div>

    return (
        <>
            {/* Desktop Table View */}
            <Card className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Reported Person / Disputed By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Evidence</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {disputes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No disputes found
                                </TableCell>
                            </TableRow>
                        ) : (
                            disputes.map((dispute) => (
                                <TableRow key={dispute.id}>
                                    <TableCell>
                                        <Badge variant={
                                            dispute.status === 'APPROVED' ? 'default' :
                                                dispute.status === 'REJECTED' ? 'destructive' :
                                                    'outline'
                                        }>
                                            {dispute.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {dispute.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium">{dispute.report?.reported_full_name}</span>
                                                <span className="text-xs text-muted-foreground">by {dispute.disputer?.email}</span>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 text-xs w-fit"
                                                onClick={() => {
                                                    window.location.href = `/admin?report=${dispute.report_id}`
                                                }}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                View Report
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={dispute.reason}>
                                        {dispute.reason}
                                    </TableCell>
                                    <TableCell>
                                        {dispute.evidence && dispute.evidence.length > 0 ? (
                                            <div className="flex flex-col gap-2 max-w-xs">
                                                {dispute.evidence.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center gap-2 p-2 bg-muted/30 border rounded-lg cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all group"
                                                        onClick={() => handleViewEvidence(file.storage_path, file.mime_type)}
                                                    >
                                                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                            {file.mime_type.includes('image') ? (
                                                                <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                            ) : (
                                                                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate group-hover:text-primary">{file.file_name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{file.mime_type.split('/')[0]}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {dispute.status === 'OPEN' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem
                                                        onClick={() => handleResolve(dispute.id, 'APPROVED', dispute.report_id)}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                                                    >
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Approve & Delete Report
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleResolve(dispute.id, 'REJECTED', dispute.report_id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Reject Dispute
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {disputes.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        No disputes found
                    </Card>
                ) : (
                    disputes.map((dispute) => (
                        <Card key={dispute.id} className="p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <Badge variant={
                                        dispute.status === 'APPROVED' ? 'default' :
                                            dispute.status === 'REJECTED' ? 'destructive' :
                                                'outline'
                                    }>
                                        {dispute.status}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                {dispute.status === 'OPEN' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuItem
                                                onClick={() => handleResolve(dispute.id, 'APPROVED', dispute.report_id)}
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Approve & Delete Report
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleResolve(dispute.id, 'REJECTED', dispute.report_id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Reject Dispute
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Category */}
                            <Badge variant="secondary" className="font-mono text-xs">
                                {dispute.category}
                            </Badge>

                            {/* Reported Person */}
                            <div className="space-y-2">
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium">{dispute.report?.reported_full_name}</span>
                                    <span className="text-xs text-muted-foreground">by {dispute.disputer?.email}</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs w-full"
                                    onClick={() => {
                                        window.location.href = `/admin?report=${dispute.report_id}`
                                    }}
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Report
                                </Button>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Reason</p>
                                <p className="text-sm">{dispute.reason}</p>
                            </div>

                            {/* Evidence */}
                            {dispute.evidence && dispute.evidence.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Evidence</p>
                                    <div className="space-y-2">
                                        {dispute.evidence.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-2 p-2 bg-muted/30 border rounded-lg cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all group"
                                                onClick={() => handleViewEvidence(file.storage_path, file.mime_type)}
                                            >
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                                    {file.mime_type.includes('image') ? (
                                                        <ImageIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate group-hover:text-primary">{file.file_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{file.mime_type.split('/')[0]}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            <FileViewerDialog
                open={!!viewFileUrl}
                onOpenChange={() => setViewFileUrl(null)}
                fileUrl={viewFileUrl || ""}
                fileType={viewFileType}
                fileName="Dispute Evidence"
            />

            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.type === 'APPROVED' ? "Approve Dispute & Remove Report?" : "Reject Dispute?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.type === 'APPROVED' ? (
                                "This will mark the incident report as DELETED and remove it from public search results. The dispute will be marked as APPROVED."
                            ) : (
                                "This will mark the dispute as REJECTED. The incident report will remain active and visible in search results."
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={processResolution}
                            className={confirmDialog.type === 'APPROVED' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            {confirmDialog.type === 'APPROVED' ? "Approve Dispute" : "Reject Dispute"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
