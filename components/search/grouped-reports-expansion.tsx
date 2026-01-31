"use client"

import { getReportGroup } from "@/app/actions/report-merge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"
import { AlertTriangle, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type Report = Database["public"]["Tables"]["incident_reports"]["Row"]

interface GroupedReportsExpansionProps {
    groupId: string
    primaryReportId?: string
    defaultExpanded?: boolean
}

export function GroupedReportsExpansion({
    groupId,
    primaryReportId,
    defaultExpanded = false
}: GroupedReportsExpansionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasLoaded, setHasLoaded] = useState(false)

    const handleToggle = () => {
        setIsExpanded(!isExpanded)
    }

    useEffect(() => {
        if (isExpanded && !hasLoaded && !isLoading) {
            loadReports()
        }
    }, [isExpanded, hasLoaded])

    const loadReports = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await getReportGroup(groupId)
            if (result.success && result.data) {
                // Filter out the primary report if needed, or keep all
                // Usually we want to see the history, so showing all is fine.
                // But if the parent card already shows the primary details, maybe we filter?
                // Let's keep all for now for completeness, but maybe mark the primary.
                setReports(result.data.reports)
                setHasLoaded(true)
            } else {
                setError(result.error || "Failed to load reports")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (!groupId) return null

    return (
        <div className="w-full mt-2 border-t pt-2">
            <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground p-0 h-auto py-2"
                onClick={handleToggle}
            >
                <span className="flex items-center gap-2 text-xs font-medium">
                    {isExpanded ? "Hide" : "Show"} All Reports in Group
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
                {!hasLoaded && !isLoading && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        Click to load history
                    </span>
                )}
            </Button>

            {isExpanded && (
                <div className="space-y-3 mt-2 pl-4 border-l-2 border-muted">
                    {isLoading && (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {error}
                        </div>
                    )}

                    {reports.map((report) => (
                        <div key={report.id} className="bg-muted/30 rounded-md p-3 text-sm hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-foreground">
                                    {report.incident_type?.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                    {report.id === primaryReportId && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">Primary</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(report.incident_date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                                {report.incident_city && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {report.incident_city}, {report.incident_region}
                                    </div>
                                )}
                                {report.amount_involved && (
                                    <div className="flex items-center gap-1 font-mono">
                                        ₱{report.amount_involved.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {report.summary && (
                                <p className="text-xs line-clamp-2 mb-2 italic">
                                    "{report.summary}"
                                </p>
                            )}

                            <div className="flex justify-end">
                                <Link
                                    href={`/report?id=${report.id}`}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    View Full Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
