"use client"

import { searchRenters } from "@/app/actions/search"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth/auth-provider"
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Download,
    Facebook,
    FileText,
    Info,
    Loader2,
    Lock,
    Mail,
    Phone,
    Search,
    Shield,
    User,
    XCircle,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface ClearanceResult {
    status: "CLEAR" | "HAS_INCIDENTS" | "UNVERIFIED_INCIDENTS"
    totalIncidents: number
    verifiedIncidents: number
    renterName: string
    searchedAt: string
    identifiersSearched: string[]
}

export default function TenantClearancePage() {
    const { user } = useAuth()
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [facebook, setFacebook] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [result, setResult] = useState<ClearanceResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!fullName.trim()) {
            setError("Please enter the renter's full name.")
            return
        }
        if (!phone && !email && !facebook) {
            setError("Please provide at least one contact identifier (phone, email, or Facebook).")
            return
        }

        setIsSearching(true)
        setError(null)
        setResult(null)

        try {
            // Build query string for multi-input search
            const queryParts = [fullName.trim()]
            if (phone) queryParts.push(phone.trim())
            if (email) queryParts.push(email.trim())
            if (facebook) queryParts.push(facebook.trim())

            const response = await searchRenters(queryParts.join(", "))

            if (!response.success) {
                setError(response.error || "Search failed. Please try again.")
                return
            }

            // Find the best match (highest confidence)
            const topMatch = response.results[0]

            const identifiersSearched: string[] = []
            if (phone) identifiersSearched.push(`Phone: ${phone}`)
            if (email) identifiersSearched.push(`Email: ${email}`)
            if (facebook) identifiersSearched.push(`Facebook: ${facebook}`)

            if (!topMatch || topMatch.confidence === "NONE" || topMatch.score < 30) {
                // No match found = clean record
                setResult({
                    status: "CLEAR",
                    totalIncidents: 0,
                    verifiedIncidents: 0,
                    renterName: fullName.trim(),
                    searchedAt: new Date().toISOString(),
                    identifiersSearched,
                })
            } else if (topMatch.renter.verifiedIncidents && topMatch.renter.verifiedIncidents > 0) {
                setResult({
                    status: "HAS_INCIDENTS",
                    totalIncidents: topMatch.renter.totalIncidents || 0,
                    verifiedIncidents: topMatch.renter.verifiedIncidents || 0,
                    renterName: fullName.trim(),
                    searchedAt: new Date().toISOString(),
                    identifiersSearched,
                })
            } else {
                setResult({
                    status: "UNVERIFIED_INCIDENTS",
                    totalIncidents: topMatch.renter.totalIncidents || 0,
                    verifiedIncidents: 0,
                    renterName: fullName.trim(),
                    searchedAt: new Date().toISOString(),
                    identifiersSearched,
                })
            }
        } catch {
            setError("An unexpected error occurred. Please try again.")
        } finally {
            setIsSearching(false)
        }
    }

    const handleReset = () => {
        setResult(null)
        setError(null)
        setFullName("")
        setPhone("")
        setEmail("")
        setFacebook("")
    }

    return (
        <div className="min-h-screen bg-muted/10">
            <AppHeader currentPage="search" />

            <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-4">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Tenant Clearance Check</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Check if a renter has any incident reports in the RenterCheck database.
                        Provide as many identifiers as possible for the most accurate result.
                    </p>
                </div>

                {/* Auth Gate */}
                {!user ? (
                    <div className="bg-card border-2 border-primary/20 rounded-xl p-8 text-center shadow-xl space-y-4">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                <Lock className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold">Sign In Required</h3>
                        <p className="text-muted-foreground">
                            You must be a registered rental business to run clearance checks.
                            This ensures responsible use of the platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Button asChild size="lg">
                                <Link href="/signup?returnTo=/clearance">Create Account</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/login?returnTo=/clearance">Sign In</Link>
                            </Button>
                        </div>
                    </div>
                ) : result ? (
                    /* Results View */
                    <div className="space-y-6">
                        {/* Result Card */}
                        <div className={`rounded-xl border-2 p-8 text-center shadow-lg ${
                            result.status === "CLEAR"
                                ? "bg-green-50 border-green-300"
                                : result.status === "HAS_INCIDENTS"
                                ? "bg-red-50 border-red-300"
                                : "bg-amber-50 border-amber-300"
                        }`}>
                            <div className="flex justify-center mb-4">
                                {result.status === "CLEAR" ? (
                                    <div className="rounded-full bg-green-100 p-4">
                                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                                    </div>
                                ) : result.status === "HAS_INCIDENTS" ? (
                                    <div className="rounded-full bg-red-100 p-4">
                                        <XCircle className="h-12 w-12 text-red-600" />
                                    </div>
                                ) : (
                                    <div className="rounded-full bg-amber-100 p-4">
                                        <AlertTriangle className="h-12 w-12 text-amber-600" />
                                    </div>
                                )}
                            </div>

                            <h2 className={`text-2xl font-bold mb-2 ${
                                result.status === "CLEAR" ? "text-green-900"
                                : result.status === "HAS_INCIDENTS" ? "text-red-900"
                                : "text-amber-900"
                            }`}>
                                {result.status === "CLEAR"
                                    ? "Clean Record"
                                    : result.status === "HAS_INCIDENTS"
                                    ? "Incidents Found"
                                    : "Unverified Reports"}
                            </h2>

                            <p className={`text-sm mb-4 ${
                                result.status === "CLEAR" ? "text-green-700"
                                : result.status === "HAS_INCIDENTS" ? "text-red-700"
                                : "text-amber-700"
                            }`}>
                                {result.status === "CLEAR"
                                    ? `No incident reports found for ${result.renterName} in our database.`
                                    : result.status === "HAS_INCIDENTS"
                                    ? `${result.renterName} has ${result.verifiedIncidents} verified incident report${result.verifiedIncidents !== 1 ? "s" : ""} on record.`
                                    : `${result.renterName} has ${result.totalIncidents} unverified report${result.totalIncidents !== 1 ? "s" : ""} pending review.`}
                            </p>

                            {result.status !== "CLEAR" && (
                                <div className="flex justify-center gap-4 mb-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{result.totalIncidents}</p>
                                        <p className="text-xs text-muted-foreground">Total Reports</p>
                                    </div>
                                    <Separator orientation="vertical" className="h-10" />
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{result.verifiedIncidents}</p>
                                        <p className="text-xs text-muted-foreground">Verified</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Checked on {new Date(result.searchedAt).toLocaleString("en-PH", {
                                    dateStyle: "long",
                                    timeStyle: "short",
                                })}
                            </p>
                        </div>

                        {/* Identifiers Searched */}
                        <div className="bg-background border rounded-lg p-4">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                Identifiers Searched
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">{result.renterName}</Badge>
                                {result.identifiersSearched.map((id, i) => (
                                    <Badge key={i} variant="outline">{id}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Important Disclaimer</p>
                                <p>
                                    A clean record does not guarantee a renter's trustworthiness. RenterCheck only shows
                                    reports submitted by other rental businesses. Always conduct your own due diligence
                                    before entering into a rental agreement.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleReset} variant="outline" className="flex-1">
                                Check Another Renter
                            </Button>
                            {result.status !== "CLEAR" && (
                                <Button asChild className="flex-1">
                                    <Link href={`/search?q=${encodeURIComponent([fullName, phone, email, facebook].filter(Boolean).join(", "))}`}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Full Details
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Search Form */
                    <div className="bg-background border rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">For Rental Businesses Only</p>
                                <p>
                                    This tool is intended for verified rental businesses to screen potential renters.
                                    Misuse may result in account suspension and legal liability under RA 10173.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-5">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Full Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    placeholder="e.g. Juan Dela Cruz"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <Separator />
                            <p className="text-sm text-muted-foreground">
                                Provide at least one identifier below for accurate results:
                            </p>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="e.g. 09123456789 or +639123456789"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. juan@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Facebook */}
                            <div className="space-y-2">
                                <Label htmlFor="facebook" className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-muted-foreground" />
                                    Facebook Profile URL
                                </Label>
                                <Input
                                    id="facebook"
                                    type="url"
                                    placeholder="e.g. https://facebook.com/juandelacruz"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={isSearching}>
                                {isSearching ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Run Clearance Check
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Credit Cost Note */}
                        <div className="text-center text-xs text-muted-foreground border-t pt-4">
                            Credits are deducted per identifier searched. Re-searches within 24 hours are free.
                            <Link href="/credits" className="text-primary hover:underline ml-1">
                                View credit costs →
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
