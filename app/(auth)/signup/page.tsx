import { SignupForm } from "@/components/auth/signup-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign up | RenterCheck",
    description: "Create a new account",
}

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ returnTo?: string }>
}) {
    const params = await searchParams
    return <SignupForm returnTo={params.returnTo} />
}
