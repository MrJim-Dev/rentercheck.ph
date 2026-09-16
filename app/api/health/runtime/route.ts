import { query } from "@/lib/db/pool"
import { createClient } from "@/lib/db/client"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Non-sensitive AWS runtime probe. It proves the selected Vercel deployment
 * can open the direct PostgreSQL path and execute through the reviewed query
 * boundary without returning credentials or user data.
 */
export async function GET(): Promise<NextResponse> {
    try {
        await query("SELECT 1 AS ok")
        const client = await createClient()
        const compatibilityProbe = await client
            .from("credit_action_costs")
            .select("action_key")
            .limit(1)

        if (compatibilityProbe.error) {
            return NextResponse.json({ status: "error", runtime: "mrjim", database: "reachable", queryBoundary: "unavailable" }, { status: 503 })
        }

        return NextResponse.json({ status: "ok", runtime: "mrjim", database: "reachable", queryBoundary: "reachable" })
    } catch {
        return NextResponse.json({ status: "error", runtime: "mrjim", database: "unavailable" }, { status: 503 })
    }
}
