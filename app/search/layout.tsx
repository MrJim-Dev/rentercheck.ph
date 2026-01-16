import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Search Tenant History",
    description: "Search and verify rental tenant history. Background-check renters by name, email, or phone before approving rental applications.",
    robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
    },
}

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
