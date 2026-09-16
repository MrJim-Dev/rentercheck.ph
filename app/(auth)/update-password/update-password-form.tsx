"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/auth/browser-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function UpdatePasswordForm() {
    const params = useSearchParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)
    const email = params.get("email") || ""
    const token = params.get("token") || ""

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        if (!email || !token) {
            setError("This recovery link is missing required information.")
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }
        setLoading(true)
        const result = await createClient().auth.resetPassword({
            email,
            token,
            password,
            options: { redirectTo: `${window.location.origin}/update-password` },
        })
        setLoading(false)
        if (result.error) {
            setError(result.error.message)
            return
        }
        setSaved(true)
    }

    return (
        <div className="container flex min-h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">Choose a new password</h1>
                    <p className="text-sm text-muted-foreground">Your recovery link is single-use and expires shortly.</p>
                </div>
                {saved ? (
                    <div className="space-y-4 rounded-md border p-4 text-sm">
                        Your password was updated.
                        <Link className="block underline" href="/login">Return to sign in</Link>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={submit}>
                        <Input type="password" required minLength={8} autoComplete="new-password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
                        <Input type="password" required minLength={8} autoComplete="new-password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
                    </form>
                )}
            </div>
        </div>
    )
}
