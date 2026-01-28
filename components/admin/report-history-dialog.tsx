"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, User, Loader2, FileEdit } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReportEdit {
    id: string
    edited_at: string
    edited_by_email: string | null
    changes: Record<string, { old: unknown; new: unknown }>
    change_note: string
}

interface ReportHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    reportId: string
    onLoadHistory: (reportId: string) => Promise<ReportEdit[]>
}

const FIELD_LABELS: Record<string, string> = {
    // Renter Identity
    reported_full_name: "Full Name",
    reported_phone: "Phone Number",
    reported_email: "Email Address",
    reported_facebook: "Facebook Profile",
    reported_address: "Address",
    reported_city: "City",
    reported_date_of_birth: "Date of Birth",
    
    // Multiple Identifiers (arrays)
    reported_phones: "Phone Numbers",
    reported_emails: "Email Addresses",
    reported_facebooks: "Facebook Profiles",
    reported_aliases: "Aliases / Alternative Names",
    
    // Rental Details
    rental_category: "Rental Business Type",
    rental_item_description: "Rental Item Description",
    
    // Incident Details
    incident_type: "Incident Type",
    incident_date: "Incident Date",
    incident_end_date: "End Date",
    incident_place: "Incident Location",
    incident_city: "Incident City",
    incident_region: "Incident Region",
    amount_involved: "Amount Involved",
    summary: "Incident Summary",
    
    // Admin Fields
    admin_notes: "Admin Notes",
    status: "Status",
    rejection_reason: "Rejection Reason",
    
    // Review Status
    credibility_score: "Credibility Score",
}

export function ReportHistoryDialog({
    open,
    onOpenChange,
    reportId,
    onLoadHistory,
}: ReportHistoryDialogProps) {
    const [history, setHistory] = useState<ReportEdit[]>([])
    const [loading, setLoading] = useState(false)

    const loadHistory = useCallback(async () => {
        setLoading(true)
        try {
            const data = await onLoadHistory(reportId)
            setHistory(data)
        } catch (error) {
            console.error("Failed to load history:", error)
        } finally {
            setLoading(false)
        }
    }, [reportId, onLoadHistory])

    useEffect(() => {
        if (open && reportId) {
            loadHistory()
        }
    }, [open, reportId, loadHistory])

    const formatValue = (value: unknown) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-muted-foreground italic">Empty</span>
        }
        if (typeof value === "boolean") {
            return value ? "Yes" : "No"
        }
        if (typeof value === "number") {
            return value.toLocaleString()
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-muted-foreground italic">None</span>
            }
            return (
                <div className="space-y-1">
                    {value.map((item, idx) => (
                        <div key={idx} className="text-xs">• {String(item)}</div>
                    ))}
                </div>
            )
        }
        return String(value)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileEdit className="w-5 h-5" />
                        Edit History
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <FileEdit className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">No edit history found</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[calc(90vh-120px)]">
                        <div className="space-y-4 pr-4">
                            {history.map((edit) => (
                                <div key={edit.id} className="border rounded-lg p-4 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{edit.edited_by_email || "Unknown"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(edit.edited_at).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Change Note */}
                                    {edit.change_note && (
                                        <div className="bg-muted/50 rounded p-3">
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Reason:</p>
                                            <p className="text-sm">{edit.change_note}</p>
                                        </div>
                                    )}

                                    {/* Changes */}
                                    <div className="space-y-3">
                                        {Object.entries(edit.changes).map(([field, change]) => (
                                            <div key={field} className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        {FIELD_LABELS[field] || field}
                                                    </p>
                                                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                                        <p className="text-red-300 font-mono text-xs break-all">
                                                            {formatValue(change.old)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">
                                                        Changed to
                                                    </p>
                                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                                                        <p className="text-emerald-300 font-mono text-xs break-all">
                                                            {formatValue(change.new)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    )
}
