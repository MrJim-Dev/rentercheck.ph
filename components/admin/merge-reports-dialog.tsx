"use client"

import { mergeReports } from "@/app/actions/report-merge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"
import { Calendar, DollarSign, Info, Link2, Loader2, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]

interface MergeReportsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    preSelectedReport?: Report
    availableReports: Report[]
    onSuccess?: () => void
}

export function MergeReportsDialog({
    open,
    onOpenChange,
    preSelectedReport,
    availableReports,
    onSuccess
}: MergeReportsDialogProps) {
    const { toast } = useToast()
    const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(
        preSelectedReport ? new Set([preSelectedReport.id]) : new Set()
    )
    const [primaryReportId, setPrimaryReportId] = useState<string>(
        preSelectedReport?.id || ""
    )
    const [groupName, setGroupName] = useState("")
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter reports into Recommended matches only
    const { recommendedReports } = useMemo(() => {
        if (!preSelectedReport) {
            return { recommendedReports: [] }
        }

        const normalizedName = preSelectedReport.reported_full_name?.toLowerCase().trim() || ""

        const recommended: Report[] = []

        availableReports.forEach(report => {
            const reportName = report.reported_full_name?.toLowerCase().trim() || ""
            if (reportName === normalizedName) {
                recommended.push(report)
            }
        })

        return { recommendedReports: recommended }
    }, [availableReports, preSelectedReport])

    const handleToggleReport = (reportId: string) => {
        const newSelected = new Set(selectedReportIds)
        if (newSelected.has(reportId)) {
            newSelected.delete(reportId)
            // If we removed the primary, reset it
            if (primaryReportId === reportId) {
                setPrimaryReportId(newSelected.values().next().value || "")
            }
        } else {
            newSelected.add(reportId)
            // If this is the first selection, make it primary
            if (newSelected.size === 1) {
                setPrimaryReportId(reportId)
            }
        }
        setSelectedReportIds(newSelected)
    }

    const handleSubmit = async () => {
        if (selectedReportIds.size < 2) {
            toast({
                variant: "destructive",
                title: "Invalid selection",
                description: "Please select at least 2 reports to merge"
            })
            return
        }

        if (!primaryReportId) {
            toast({
                variant: "destructive",
                title: "Invalid selection",
                description: "Please select a primary report"
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await mergeReports(
                Array.from(selectedReportIds),
                primaryReportId,
                groupName || undefined,
                notes || undefined
            )

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Successfully merged ${selectedReportIds.size} reports`
                })
                onSuccess?.()
                onOpenChange(false)
                // Reset form
                setSelectedReportIds(new Set())
                setPrimaryReportId("")
                setGroupName("")
                setNotes("")
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to merge reports"
                })
            }
        } catch (error) {
            console.error("Error merging reports:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedReports = availableReports.filter(r => selectedReportIds.has(r.id))
    const primaryReport = availableReports.find(r => r.id === primaryReportId)

    const renderReportItem = (report: Report) => {
        const isSelected = selectedReportIds.has(report.id)
        const isPrimary = primaryReportId === report.id

        return (
            <div
                key={report.id}
                className={`p-3 rounded-lg border hover:bg-muted/50 transition-colors ${isSelected ? "bg-muted/30 border-primary/20" : "border-border"
                    }`}
            >
                <div className="flex items-start gap-3">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleReport(report.id)}
                        className="mt-1"
                    />
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{report.reported_full_name}</span>
                                {isPrimary && (
                                    <Badge variant="default" className="text-[10px] h-5 px-1.5">
                                        Primary
                                    </Badge>
                                )}
                            </div>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {report.incident_type?.replace(/_/g, " ")}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(report.incident_date).toLocaleDateString()}
                            </div>
                            {report.amount_involved && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ₱{report.amount_involved.toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        Merge Incident Reports
                    </SheetTitle>
                    <SheetDescription>
                        Group multiple reports about the same person into a single search result.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 py-6">
                        {/* Warning Alert */}
                        <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-100">
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <AlertDescription className="text-xs">
                                We've found these reports that appear to match the same person. Select the ones you wish to merge.
                            </AlertDescription>
                        </Alert>

                        {/* Report Selection */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold flex items-center justify-between">
                                <span>Matching Reports</span>
                                <span className="text-xs font-normal text-muted-foreground">{recommendedReports.length} found</span>
                            </Label>

                            {/* Matching Reports List */}
                            {recommendedReports.length > 0 ? (
                                <div className="space-y-2">
                                    {recommendedReports.map(renderReportItem)}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg text-center border-dashed border">
                                    No other matching reports found.
                                </div>
                            )}
                        </div>

                        {/* Primary Report Selection */}
                        {selectedReportIds.size >= 2 && (
                            <div className="space-y-3 pt-2 border-t">
                                <Label className="text-sm font-semibold">
                                    Select Primary Report
                                </Label>
                                <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-100">
                                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <AlertDescription className="text-xs">
                                        Only the <strong>Primary Report</strong> will appear in search results. Other reports in the group will be hidden to prevent duplicates.
                                    </AlertDescription>
                                </Alert>
                                <RadioGroup value={primaryReportId} onValueChange={setPrimaryReportId}>
                                    <div className="space-y-2">
                                        {selectedReports.map((report) => (
                                            <div key={report.id} className="flex items-center space-x-2 border rounded-md p-3">
                                                <RadioGroupItem value={report.id} id={`primary-${report.id}`} />
                                                <Label
                                                    htmlFor={`primary-${report.id}`}
                                                    className="text-sm font-normal cursor-pointer flex-1"
                                                >
                                                    <span className="font-medium">{report.reported_full_name}</span>
                                                    <span className="text-muted-foreground mx-1">•</span>
                                                    <span>{report.incident_type?.replace(/_/g, " ")}</span>
                                                    <span className="text-muted-foreground text-xs ml-auto block mt-0.5">
                                                        {new Date(report.incident_date).toLocaleDateString()}
                                                    </span>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {/* Group Name & Notes */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="groupName" className="text-sm">Group Name (Optional)</Label>
                                <Input
                                    id="groupName"
                                    placeholder="e.g., Juan Dela Cruz - Consolidated"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm">Admin Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Reason for grouping..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="border-t p-4 bg-background mt-auto">
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={selectedReportIds.size < 2 || !primaryReportId || isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Merge Reports
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
