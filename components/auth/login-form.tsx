"use client"

import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, Github, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

export function LoginForm() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Sign in</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
                {error && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-xs text-destructive">{error}</p>
                    </div>
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground/80">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium leading-none text-muted-foreground/80">
                            Password
                        </label>
                        <Link href="#" className="text-xs text-secondary hover:text-accent transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-secondary transition-colors" size={16} />
                        <Input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-9 h-10 bg-background/50 border-input/50 focus-visible:border-secondary focus-visible:ring-secondary/20 transition-all font-medium text-sm"
                            required
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity font-bold h-10 mt-2 cursor-pointer"
                    disabled={isPending}
                >
                    {isPending ? "Signing in..." : "Sign in"}
                    {!isPending && <ArrowRight className="ml-2" size={16} />}
                </Button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button variant="outline" className="w-full h-10 border-input/50 hover:bg-input/20 hover:text-foreground cursor-pointer">
                        <Github className="mr-2 h-4 w-4" />
                        Github
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-10 border-input/50 hover:bg-input/20 hover:text-foreground cursor-pointer"
                        onClick={async () => {
                            const supabase = createClient()
                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${location.origin}/auth/callback`,
                                },
                            })
                        }}
                        type="button"
                    >
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Google
                    </Button>
                </div>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-secondary hover:text-accent font-semibold transition-colors">
                    Sign up
                </Link>
            </p>
        </div>
    )
}
