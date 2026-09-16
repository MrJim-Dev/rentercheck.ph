import { clearMrJimSession } from "@/lib/auth/server"
import { NextResponse } from "next/server"

export async function POST(): Promise<NextResponse> {
    await clearMrJimSession()
    return new NextResponse(null, { status: 204 })
}
