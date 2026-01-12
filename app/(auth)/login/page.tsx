import { LoginForm } from "@/components/auth/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign in | RenterCheck",
    description: "Sign in to your account",
}

export default function LoginPage() {
    return <LoginForm />
}
