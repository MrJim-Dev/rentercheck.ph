"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/auth/browser-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setLoading(true)
        const result = await createClient().auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        })
        setLoading(false)
        if (result.error) {
            setError(result.error.message)
            return
        }
        setSent(true)
    }

    return (
        <div className="container flex min-h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">Reset your password</h1>
                    <p className="text-sm text-muted-foreground">Enter your email and we will send a secure recovery link.</p>
                </div>
                {sent ? (
                    <div className="space-y-4 rounded-md border p-4 text-sm">
                        Check your inbox for a recovery link. If the account exists, the message will open the secure password-reset page.
                        <Link className="block underline" href="/login">Return to sign in</Link>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={submit}>
                        <Input type="email" required autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Sending…" : "Send recovery link"}</Button>
                    </form>
                )}
                {!sent ? <Link className="text-center text-sm underline" href="/login">Back to sign in</Link> : null}
            </div>
        </div>
    )
}
