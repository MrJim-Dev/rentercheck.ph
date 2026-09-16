import { sanitizeReturnTo } from "@/lib/auth/redirect"
import { createMrJimAuthClient } from "@/lib/auth/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request): Promise<NextResponse> {
    const requestUrl = new URL(request.url)
    const provider = requestUrl.searchParams.get("provider") || "google"
    const next = sanitizeReturnTo(requestUrl.searchParams.get("next"))

    if (provider !== "google") {
        return NextResponse.json({ error: "Unsupported auth provider" }, { status: 400 })
    }

    const client = await createMrJimAuthClient()
    const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error || !data?.url) {
        return NextResponse.json({ error: error?.message || "MrJim Auth did not return an authorization URL" }, { status: 502 })
    }
    return NextResponse.redirect(data.url)
}
