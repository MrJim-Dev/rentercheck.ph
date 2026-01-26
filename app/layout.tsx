import { Toaster } from "@/components/ui/toaster"
import { FloatingReportButton } from "@/components/shared/floating-report-button"
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
    title: {
        default: "RenterCheck - Background-check renters and approve with confidence",
        template: "%s | RenterCheck"
    },
    description:
        "Background-check renters and approve with confidence. Instant tenant verification for rental properties in the Philippines. Search renter history, verify tenant background, and protect your rental business from problematic tenants.",
    keywords: [
        "renter background check Philippines",
        "tenant verification Philippines",
        "rental screening service",
        "tenant history check",
        "renter check Philippines",
        "tenant background verification",
        "rental tenant screening",
        "landlord tenant verification",
        "rental property screening",
        "tenant credit check",
        "renter incident report",
        "bad tenant database",
        "rental background check",
        "tenant verification service",
        "Philippines landlord tools",
    ],
    authors: [{ name: "RenterCheck" }],
    creator: "RenterCheck",
    publisher: "RenterCheck",
    metadataBase: new URL("https://rentercheck.ph"),
    openGraph: {
        title: "RenterCheck - Background-check renters and approve with confidence",
        description:
            "Instant tenant verification for rental properties in the Philippines. Search renter history, verify backgrounds, and protect your rental business from problematic tenants.",
        url: "https://rentercheck.ph",
        siteName: "RenterCheck",
        locale: "en_PH",
        type: "website",
        images: [{
            url: "/thumbnail.png",
            width: 1200,
            height: 630,
            alt: "RenterCheck - Background-check renters in seconds"
        }]
    },
    twitter: {
        card: "summary_large_image",
        title: "RenterCheck - Background-check renters and approve with confidence",
        description:
            "Instant tenant verification for rental properties in the Philippines. Protect your rental business from problematic tenants.",
        images: ["/thumbnail.png"]
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
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'RenterCheck',
        description: 'Background-check renters and approve with confidence. Instant tenant verification for rental properties in the Philippines.',
        url: 'https://rentercheck.ph',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'PHP',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '150',
        },
    }

    return (
        <html lang="en" className="dark">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className={`${_geist.className} font-sans antialiased`}>
                <AuthProvider>
                    {children}
                    <FloatingReportButton />
                    <Toaster />
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    )
}
