"use client"

import { ReportForm } from "@/components/report/report-form"
import { Shield, FileWarning, Clock, CheckCircle, Lock, LogIn } from "lucide-react"
import Link from "next/link"
import { AppHeader } from "@/components/shared/app-header"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function ReportPage() {
    const { user, loading } = useAuth();

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

                    {/* The Form or Sign-in Prompt */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : !user ? (
                        // Non-authenticated user - show sign-in prompt
                        <div className="bg-card border-2 border-primary/20 rounded-xl p-8 md:p-12 shadow-xl text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-primary/10 p-5">
                                    <Lock className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl md:text-3xl font-bold">Sign In Required</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    To file an incident report and help protect the community, please sign in to your account or create a new one.
                                </p>
                            </div>
                            <div className="pt-4 space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button asChild size="lg" className="min-w-[200px]">
                                        <Link href="/signup">
                                            <LogIn className="mr-2 h-5 w-5" />
                                            Create Account
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="min-w-[200px]">
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Why sign in?</strong>
                                </p>
                                <ul className="text-sm text-muted-foreground mt-2 space-y-1 max-w-md mx-auto">
                                    <li>✓ Track your submitted reports</li>
                                    <li>✓ Receive updates on report status</li>
                                    <li>✓ Help build a trusted community</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <ReportForm />
                    )}

                    {/* Footer disclaimer */}
                    {user && (
                    <div className="mt-10 text-center">
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            By submitting this report, you agree to our{" "}
                            <Link href="#" className="text-secondary hover:underline">Terms of Service</Link>
                            {" "}and{" "}
                            <Link href="#" className="text-secondary hover:underline">Privacy Policy</Link>.
                            False reports may result in legal action.
                        </p>
                    </div>
                    )}
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
