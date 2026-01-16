import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Report Renter Incident",
    description: "Report problematic renter behavior to protect other rental businesses. File incidents including unpaid rent, property damage, lease violations, and more. All reports are admin-verified.",
    keywords: [
        "report bad tenant Philippines",
        "file renter incident",
        "tenant complaint form",
        "report rental issues",
        "bad tenant report",
        "landlord incident report",
        "report problem tenant",
        "rental dispute Philippines",
    ],
    openGraph: {
        title: "Report Renter Incident | RenterCheck",
        description: "Help protect the rental community by reporting problematic tenant behavior. Verified admin-reviewed reports.",
    },
}

export default function ReportLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
