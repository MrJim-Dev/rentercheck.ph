import { toClientAuthUser } from "@/lib/auth/mrjim-auth"
import { getCurrentIdentity } from "@/lib/auth/server"
import { NextResponse } from "next/server"

function noStore(response: NextResponse): NextResponse {
    response.headers.set("Cache-Control", "private, no-store")
    return response
}

export async function GET(): Promise<NextResponse> {
    const identity = await getCurrentIdentity()
    return noStore(NextResponse.json({
        provider: "mrjim-auth",
        user: identity ? toClientAuthUser(identity) : null,
    }))
}
