"use client"

import { ReportForm } from "@/components/report/report-form"
import { Shield, FileWarning, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { AppHeader } from "@/components/shared/app-header"

export default function ReportPage() {
    return (
        <div className="min-h-screen bg-background">
            <AppHeader currentPage="report" />

            {/* Main Content */}
            <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Page Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium mb-4">
                            <FileWarning className="w-4 h-4" />
                            File an Incident Report
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                            Report a Renter Incident
                        </h1>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Help protect other landlords and businesses by reporting incidents. 
                            All reports are reviewed by our team before being published.
                        </p>
                    </div>

                    {/* Trust indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Verified Reports</p>
                                <p className="text-xs text-muted-foreground">Admin-reviewed</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">24-48h Review</p>
                                <p className="text-xs text-muted-foreground">Quick turnaround</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">Evidence-Based</p>
                                <p className="text-xs text-muted-foreground">Proof required</p>
                            </div>
                        </div>
                    </div>

                    {/* The Form */}
                    <ReportForm />

                    {/* Footer disclaimer */}
                    <div className="mt-10 text-center">
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            By submitting this report, you agree to our{" "}
                            <Link href="#" className="text-secondary hover:underline">Terms of Service</Link>
                            {" "}and{" "}
                            <Link href="#" className="text-secondary hover:underline">Privacy Policy</Link>.
                            False reports may result in legal action.
                        </p>
                    </div>
                </div>
            </main>

            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-destructive/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-secondary/5 to-transparent rounded-full blur-3xl" />
            </div>
        </div>
    )
}
