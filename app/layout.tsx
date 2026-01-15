import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
}

export const metadata: Metadata = {
    title: "RenterCheck - Rental Tenant Verification",
    description:
        "Verify rental tenants instantly. Search by name, email, or phone number to check tenant history and issues.",
    keywords: [
        "tenant verification",
        "rental screening",
        "tenant history",
        "renter check",
        "tenant background check",
        "Philippines rental",
    ],
    authors: [{ name: "RenterCheck" }],
    creator: "RenterCheck",
    publisher: "RenterCheck",
    generator: "v0.app",
    metadataBase: new URL("https://rentercheck.ph"),
    openGraph: {
        title: "RenterCheck - Rental Tenant Verification",
        description:
            "Verify rental tenants instantly. Search by name, email, or phone number to check tenant history and issues.",
        url: "https://rentercheck.ph",
        siteName: "RenterCheck",
        locale: "en_PH",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "RenterCheck - Rental Tenant Verification",
        description:
            "Verify rental tenants instantly. Search by name, email, or phone number to check tenant history and issues.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
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
                    <Toaster />
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
