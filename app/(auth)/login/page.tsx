import { LoginForm } from "@/components/auth/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign in | RenterCheck",
    description: "Sign in to your account",
}

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ returnTo?: string }>
}) {
    const params = await searchParams
    return <LoginForm returnTo={params.returnTo} />
}
