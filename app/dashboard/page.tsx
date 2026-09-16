import { redirect } from "next/navigation"

/**
 * Keep the conventional dashboard URL working while the product's existing
 * authenticated landing page remains /my-reports.
 */
export default function DashboardPage() {
    redirect("/my-reports")
}
