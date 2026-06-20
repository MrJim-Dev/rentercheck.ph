import { SignupForm } from "@/components/auth/signup-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign up",
    description: "Create a RenterCheck account for your rental business.",
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
}

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ returnTo?: string }>
}) {
    const params = await searchParams
    return <SignupForm returnTo={params.returnTo} />
}
