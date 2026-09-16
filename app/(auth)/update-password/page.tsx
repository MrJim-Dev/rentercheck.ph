import { Suspense } from "react"
import UpdatePasswordForm from "./update-password-form"

export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={<div className="container flex min-h-screen w-screen items-center justify-center">Loading recovery form…</div>}>
            <UpdatePasswordForm />
        </Suspense>
    )
}
