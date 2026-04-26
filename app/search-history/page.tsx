"use client"

import { getSearchHistory, getSearchStats, type SearchHistoryEntry } from "@/app/actions/search-history"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    CheckCircle2,
    Clock,
    History,
    Loader2,
    Mail,
    Phone,
    RefreshCw,
    Search,
    TrendingUp,
    User,
    Facebook,
    AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    NAME: { label: "Name", icon: User, color: "bg-blue-100 text-blue-700 border-blue-200" },
    PHONE: { label: "Phone", icon: Phone, color: "bg-green-100 text-green-700 border-green-200" },
    EMAIL: { label: "Email", icon: Mail, color: "bg-purple-100 text-purple-700 border-purple-200" },
    FACEBOOK: { label: "Facebook", icon: Facebook, color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}

function formatExpiryTime(expiresAt: string): string {
    const date = new Date(expiresAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    if (diffMs <= 0) return "Expired"
    const diffHours = Math.floor(diffMs / 3600000)
    const diffMins = Math.floor((diffMs % 3600000) / 60000)
    if (diffHours > 0) return `Expires in ${diffHours}h ${diffMins}m`
    return `Expires in ${diffMins}m`
}

export default function SearchHistoryPage() {
    const [history, setHistory] = useState<SearchHistoryEntry[]>([])
    const [stats, setStats] = useState<{
        totalSearches: number
        creditsUsedThisMonth: number
        activeSearches: number
        mostSearchedType: string | null
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [historyResult, statsResult] = await Promise.all([
                getSearchHistory(50),
                getSearchStats(),
            ])

            if (historyResult.success) {
                setHistory(historyResult.history || [])
            } else {
                setError(historyResult.error || "Failed to load search history")
            }

            if (statsResult.success) {
                setStats(statsResult.stats || null)
            }
        } catch {
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader currentPage="search" />

            <main className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2.5">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Search History</h1>
                            <p className="text-sm text-muted-foreground">
                                Your recent renter searches and credit usage
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-background border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">This Month</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.totalSearches}</p>
                            <p className="text-xs text-muted-foreground">searches</p>
                        </div>
                        <div className="bg-background border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Search className="h-4 w-4 text-purple-600" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Credits Used</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.creditsUsedThisMonth}</p>
                            <p className="text-xs text-muted-foreground">this month</p>
                        </div>
                        <div className="bg-background border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
                            </div>
                            <p className="text-2xl font-bold">{stats.activeSearches}</p>
                            <p className="text-xs text-muted-foreground">free re-searches</p>
                        </div>
                        <div className="bg-background border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-amber-600" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Top Type</span>
                            </div>
                            <p className="text-2xl font-bold capitalize">
                                {stats.mostSearchedType ? TYPE_CONFIG[stats.mostSearchedType]?.label || stats.mostSearchedType : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">most searched</p>
                        </div>
                    </div>
                )}

                {/* Free Re-search Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 mb-6">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">Free Re-search Window</p>
                        <p className="text-sm text-blue-800">
                            Searches are free to repeat within <strong>24 hours</strong>. Active searches below can be re-run at no credit cost.
                        </p>
                    </div>
                </div>

                <Separator className="mb-6" />

                {/* Search History List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Loading search history...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-800 font-medium">Failed to load search history</p>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>
                            Try Again
                        </Button>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-muted/20">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <History className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No search history yet</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Your search history will appear here after you search for renters.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/search">
                                <Search className="h-4 w-4 mr-2" />
                                Search for a Renter
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((entry) => (
                            <div
                                key={entry.id}
                                className={`bg-background border rounded-lg p-4 shadow-sm transition-colors ${entry.isActive ? "border-green-200 bg-green-50/30" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {entry.isActive && (
                                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Free Re-search
                                                </Badge>
                                            )}
                                            {entry.parameterTypes.map((type) => {
                                                const config = TYPE_CONFIG[type]
                                                if (!config) return null
                                                const Icon = config.icon
                                                return (
                                                    <Badge key={type} variant="outline" className={`text-xs ${config.color}`}>
                                                        <Icon className="h-3 w-3 mr-1" />
                                                        {config.label}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                        <p className="font-medium text-sm truncate">{entry.query}</p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatRelativeTime(entry.searchedAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {entry.isActive ? formatExpiryTime(entry.expiresAt) : "Expired"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Search className="h-3 w-3" />
                                                {entry.creditsCost} credit{entry.creditsCost !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        asChild
                                        variant={entry.isActive ? "default" : "outline"}
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        <Link href={`/search?q=${encodeURIComponent(entry.query)}`}>
                                            <Search className="h-3.5 w-3.5 mr-1.5" />
                                            {entry.isActive ? "Re-search Free" : "Search Again"}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
