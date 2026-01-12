"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Lock, Mail, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 2000)
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Create an account</h1>
                <p className="text-sm text-muted-foreground">Start verifying tenants in minutes</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium leading-none text-muted-foreground/80">
                        Full Name
                    </label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            type="text"
                            placeholder="John Doe"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium leading-none text-muted-foreground/80">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium leading-none text-muted-foreground/80">
                        Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium leading-none text-muted-foreground/80">
                        Confirm Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity font-bold h-10 mt-2 cursor-pointer"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating account..." : "Sign up"}
                    {!isLoading && <ArrowRight className="ml-2" size={16} />}
                </Button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-secondary hover:text-accent font-semibold transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
