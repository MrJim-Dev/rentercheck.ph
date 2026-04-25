"use client"

import { getTransparencyStats, type TransparencyStats } from "@/app/actions/transparency"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    FileText,
    Loader2,
    RefreshCw,
    Shield,
    TrendingDown,
    TrendingUp,
    Users,
} from "lucide-react"
import { useEffect, useState } from "react"

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    color = "blue",
}: {
    label: string
    value: string | number
    sub?: string
    icon: React.ElementType
    color?: "blue" | "green" | "red" | "amber" | "purple"
}) {
    const colorMap = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600",
        purple: "bg-purple-50 text-purple-600",
    }

    return (
        <div className="bg-background border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`rounded-full p-2 ${colorMap[color]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
    )
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{label}</span>
                <span className="font-medium tabular-nums">{count.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

export default function TransparencyPage() {
    const [stats, setStats] = useState<TransparencyStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadStats = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await getTransparencyStats()
            if (result.success && result.stats) {
                setStats(result.stats)
            } else {
                setError(result.error || "Failed to load statistics")
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadStats()
    }, [])

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader />

            <main className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">
                {/* Page Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-4">
                            <BarChart3 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Transparency Report</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        RenterCheck is committed to transparency. This page shows real-time statistics
                        about how our platform is being used, how reports are processed, and how disputes are resolved.
                    </p>
                    {stats && (
                        <p className="text-xs text-muted-foreground mt-3">
                            Last updated: {new Date(stats.generatedAt).toLocaleString("en-PH", {
                                dateStyle: "long",
                                timeStyle: "short",
                            })}
                        </p>
                    )}
                    <Button variant="outline" size="sm" className="mt-3" onClick={loadStats} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Loading statistics...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 font-medium">Failed to load statistics</p>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={loadStats}>
                            Try Again
                        </Button>
                    </div>
                ) : stats ? (
                    <div className="space-y-10">
                        {/* Platform Overview */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Platform Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    label="Total Reports"
                                    value={stats.totalReports}
                                    sub="All time"
                                    icon={FileText}
                                    color="blue"
                                />
                                <StatCard
                                    label="Approved Reports"
                                    value={stats.approvedReports}
                                    sub={`${stats.approvalRate}% approval rate`}
                                    icon={CheckCircle2}
                                    color="green"
                                />
                                <StatCard
                                    label="Unique Renters"
                                    value={stats.totalRenters}
                                    sub="In database"
                                    icon={Users}
                                    color="purple"
                                />
                                <StatCard
                                    label="This Month"
                                    value={stats.reportsThisMonth}
                                    sub={stats.growthRate >= 0
                                        ? `+${stats.growthRate}% vs last month`
                                        : `${stats.growthRate}% vs last month`}
                                    icon={stats.growthRate >= 0 ? TrendingUp : TrendingDown}
                                    color={stats.growthRate >= 0 ? "green" : "red"}
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* Report Processing */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Report Processing
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-background border rounded-xl p-5 shadow-sm">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                        Report Status Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        <BarRow label="Approved" count={stats.approvedReports} max={stats.totalReports} />
                                        <BarRow label="Pending Review" count={stats.pendingReports} max={stats.totalReports} />
                                        <BarRow label="Rejected" count={stats.rejectedReports} max={stats.totalReports} />
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                {stats.approvalRate}% Approval Rate
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                of reviewed reports
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-background border rounded-xl p-5 shadow-sm">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                        Dispute Resolution
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Total Disputes Filed</span>
                                            <span className="font-bold">{stats.totalDisputes.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Disputes Resolved</span>
                                            <span className="font-bold text-green-600">{stats.resolvedDisputes.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${stats.disputeResolutionRate}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                {stats.disputeResolutionRate}% Resolution Rate
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                                        All disputes are reviewed by our moderation team within 7 business days.
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Category & Incident Breakdown */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Top Reported Categories & Incident Types
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-background border rounded-xl p-5 shadow-sm">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                        Top Rental Categories
                                    </h3>
                                    {stats.topCategories.length > 0 ? (
                                        <div className="space-y-3">
                                            {stats.topCategories.map((cat) => (
                                                <BarRow
                                                    key={cat.category}
                                                    label={cat.label}
                                                    count={cat.count}
                                                    max={stats.topCategories[0]?.count || 1}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No data yet.</p>
                                    )}
                                </div>

                                <div className="bg-background border rounded-xl p-5 shadow-sm">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                        Top Incident Types
                                    </h3>
                                    {stats.topIncidentTypes.length > 0 ? (
                                        <div className="space-y-3">
                                            {stats.topIncidentTypes.map((type) => (
                                                <BarRow
                                                    key={type.type}
                                                    label={type.label}
                                                    count={type.count}
                                                    max={stats.topIncidentTypes[0]?.count || 1}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No data yet.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Commitments */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-primary" />
                                Our Commitments
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        title: "Data Privacy",
                                        desc: "All renter identifiers are stored securely and only accessible to verified rental businesses. We comply with RA 10173 (Data Privacy Act of 2012).",
                                        icon: Shield,
                                        color: "bg-blue-50 text-blue-600",
                                    },
                                    {
                                        title: "Fair Moderation",
                                        desc: "Every report is reviewed by our moderation team before being published. False or malicious reports are rejected and may result in account suspension.",
                                        icon: CheckCircle2,
                                        color: "bg-green-50 text-green-600",
                                    },
                                    {
                                        title: "Dispute Rights",
                                        desc: "Any individual who believes they have been falsely reported has the right to file a dispute. All disputes are reviewed fairly and impartially.",
                                        icon: FileText,
                                        color: "bg-purple-50 text-purple-600",
                                    },
                                ].map((item) => (
                                    <div key={item.title} className="bg-background border rounded-xl p-5 shadow-sm">
                                        <div className={`rounded-full p-2 w-fit mb-3 ${item.color}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-semibold mb-2">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                ) : null}
            </main>
        </div>
    )
}
