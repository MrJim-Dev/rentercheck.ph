"use client"

import { parseCsvText, submitBulkImport, type BulkImportRow } from "@/app/actions/bulk-import"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-provider"
import {
    AlertTriangle,
    CheckCircle,
    Download,
    FileSpreadsheet,
    Loader2,
    LogIn,
    Upload,
    X,
    Zap,
} from "lucide-react"
import Link from "next/link"
import { Suspense, useCallback, useRef, useState } from "react"

const SAMPLE_CSV = `full_name,phone,email,rental_category,incident_type,incident_date,summary,amount_involved
Juan Dela Cruz,09171234567,juan@example.com,REAL_ESTATE_CONDO,UNPAID_BALANCE,2024-03-15,Tenant left without paying 2 months rent. Did not respond to follow-ups.,15000
Maria Santos,09281234567,,VEHICLE_CAR,PROPERTY_DAMAGE,2024-04-01,Returned car with significant dents and broken side mirror. Refused to pay for repairs.,8500
Pedro Reyes,,pedro@email.com,REAL_ESTATE_ROOM,NO_SHOW,2024-02-20,Confirmed booking then disappeared on move-in day. Did not respond to messages.,0`

function BulkImportContent() {
    const { user, loading } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [csvText, setCsvText] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [parsedRows, setParsedRows] = useState<BulkImportRow[]>([])
    const [parseErrors, setParseErrors] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<{
        success: boolean
        totalRows: number
        successCount: number
        failedCount: number
        errors: Array<{ row: number; name: string; error: string }>
    } | null>(null)
    const [dragOver, setDragOver] = useState(false)

    const handleFileRead = useCallback((file: File) => {
        if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
            setParseErrors(["Please upload a .csv file."])
            return
        }
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = e.target?.result as string
            setCsvText(text)
            const { rows, parseErrors: errs } = await parseCsvText(text)
            setParsedRows(rows)
            setParseErrors(errs)
            setSubmitResult(null)
        }
        reader.readAsText(file)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileRead(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFileRead(file)
    }

    const handleSubmit = async () => {
        if (parsedRows.length === 0) return
        setIsSubmitting(true)
        try {
            const result = await submitBulkImport(parsedRows)
            setSubmitResult(result)
        } catch (err) {
            setSubmitResult({
                success: false,
                totalRows: parsedRows.length,
                successCount: 0,
                failedCount: parsedRows.length,
                errors: [{ row: 0, name: "System", error: "An unexpected error occurred." }],
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDownloadSample = () => {
        const blob = new Blob([SAMPLE_CSV], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "rentercheck_bulk_import_sample.csv"
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleReset = () => {
        setCsvText(null)
        setFileName(null)
        setParsedRows([])
        setParseErrors([])
        setSubmitResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader currentPage="report" />
                <main className="container mx-auto px-4 md:px-6 py-16">
                    <div className="max-w-md mx-auto text-center space-y-6">
                        <div className="rounded-full bg-primary/10 p-5 inline-flex">
                            <LogIn className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Sign In Required</h2>
                        <p className="text-muted-foreground">
                            You need to be signed in as a verified business to use bulk import.
                        </p>
                        <Button asChild size="lg">
                            <Link href="/login?returnTo=/report/bulk">Sign In</Link>
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader currentPage="report" />
            <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-medium mb-4">
                            <FileSpreadsheet className="w-4 h-4" />
                            Bulk Import
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                            Import Historical Reports
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                            Have a list of problematic renters from the past? Upload a CSV file to submit multiple reports at once. All imports are reviewed before publishing.
                        </p>
                    </div>

                    {/* Incentive Banner */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3 mb-6">
                        <Zap className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                            <strong>Earn bonus credits!</strong> Submit 10+ historical reports and earn 500 bonus credits toward future searches. Help build the community database and protect other rental businesses.
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-muted/40 border rounded-lg p-5 mb-6">
                        <h3 className="font-semibold mb-3 text-sm">CSV Format Requirements</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">full_name</span> — Required</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">phone</span> — Required if no email</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">email</span> — Required if no phone</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">rental_category</span> — e.g. VEHICLE_CAR</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">incident_type</span> — e.g. UNPAID_BALANCE</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">incident_date</span> — YYYY-MM-DD</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">summary</span> — Brief description</div>
                            <div><span className="font-mono text-xs bg-muted px-1 rounded">amount_involved</span> — Optional, in PHP</div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={handleDownloadSample}
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download Sample CSV
                        </Button>
                    </div>

                    {/* File Upload */}
                    {!submitResult && (
                        <>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                {fileName ? (
                                    <div>
                                        <p className="font-medium">{fileName}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Click to replace file</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium">Drop your CSV file here</p>
                                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                                    </div>
                                )}
                            </div>

                            {/* Parse Errors */}
                            {parseErrors.length > 0 && (
                                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {parseErrors.length} row(s) skipped during parsing
                                    </p>
                                    <ul className="text-xs text-amber-800 space-y-1">
                                        {parseErrors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                                        {parseErrors.length > 5 && <li>• ...and {parseErrors.length - 5} more</li>}
                                    </ul>
                                </div>
                            )}

                            {/* Preview */}
                            {parsedRows.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-sm">
                                            Preview — {parsedRows.length} report{parsedRows.length !== 1 ? "s" : ""} ready to import
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={handleReset}>
                                            <X className="h-3.5 w-3.5 mr-1" />
                                            Clear
                                        </Button>
                                    </div>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="text-left p-2 font-medium">#</th>
                                                        <th className="text-left p-2 font-medium">Name</th>
                                                        <th className="text-left p-2 font-medium">Phone/Email</th>
                                                        <th className="text-left p-2 font-medium">Category</th>
                                                        <th className="text-left p-2 font-medium">Type</th>
                                                        <th className="text-left p-2 font-medium">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsedRows.slice(0, 10).map((row, i) => (
                                                        <tr key={i} className="border-t">
                                                            <td className="p-2 text-muted-foreground">{i + 1}</td>
                                                            <td className="p-2 font-medium">{row.fullName}</td>
                                                            <td className="p-2 text-muted-foreground">{row.phone || row.email}</td>
                                                            <td className="p-2">
                                                                <Badge variant="outline" className="text-xs">{row.rentalCategory}</Badge>
                                                            </td>
                                                            <td className="p-2">
                                                                <Badge variant="outline" className="text-xs">{row.incidentType}</Badge>
                                                            </td>
                                                            <td className="p-2 text-muted-foreground">{row.incidentDate}</td>
                                                        </tr>
                                                    ))}
                                                    {parsedRows.length > 10 && (
                                                        <tr className="border-t">
                                                            <td colSpan={6} className="p-2 text-center text-muted-foreground">
                                                                ...and {parsedRows.length - 10} more rows
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                        <strong>Important:</strong> All imported reports will be submitted as PENDING and require admin review before they appear in search results. Reports without evidence will have a lower quality score.
                                    </div>

                                    <Button
                                        className="w-full mt-4"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting {parsedRows.length} reports...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Submit {parsedRows.length} Report{parsedRows.length !== 1 ? "s" : ""}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Submit Result */}
                    {submitResult && (
                        <div className="space-y-4">
                            <div className={`rounded-xl p-6 border-2 text-center ${submitResult.successCount > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                                {submitResult.successCount > 0 ? (
                                    <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                                ) : (
                                    <AlertTriangle className="h-10 w-10 text-red-600 mx-auto mb-3" />
                                )}
                                <h3 className="text-xl font-bold mb-1">
                                    {submitResult.successCount} of {submitResult.totalRows} reports submitted
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {submitResult.successCount > 0
                                        ? "Your reports are pending admin review. You can track them in your dashboard."
                                        : "No reports were submitted. Please check the errors below."}
                                </p>
                            </div>

                            {submitResult.errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-amber-900 mb-2">
                                        {submitResult.failedCount} report(s) failed:
                                    </p>
                                    <ul className="text-xs text-amber-800 space-y-1">
                                        {submitResult.errors.map((e, i) => (
                                            <li key={i}>• Row {e.row} ({e.name}): {e.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button asChild className="flex-1">
                                    <Link href="/my-reports">View My Reports</Link>
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={handleReset}>
                                    Import More
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default function BulkImportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <BulkImportContent />
        </Suspense>
    )
}
