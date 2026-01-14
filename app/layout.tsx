import { AuthProvider } from "@/lib/auth/auth-provider"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "RenterCheck - Rental Tenant Verification",
    description:
        "Verify rental tenants instantly. Search by name, email, or phone number to check tenant history and issues.",
    generator: "v0.app",
    icons: {
        icon: [
            { url: "/logos/rc-logo.png", sizes: "32x32", type: "image/png" },
            { url: "/logos/rc-logo.png", sizes: "16x16", type: "image/png" },
        ],
        apple: "/logos/rc-logo.png",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${_geist.className} font-sans antialiased`}>
                <AuthProvider>
                    {children}
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
