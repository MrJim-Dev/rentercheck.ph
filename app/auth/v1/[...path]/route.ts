import { getRenterCheckAuthServer } from "@/lib/auth/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function requestAtAuthOrigin(request: Request): Request {
    const configuredAuthUrl = process.env.MRJIM_AUTH_URL?.trim()
    if (!configuredAuthUrl) return request

    const incomingUrl = new URL(request.url)
    const authUrl = new URL(configuredAuthUrl)
    incomingUrl.protocol = authUrl.protocol
    incomingUrl.hostname = authUrl.hostname
    incomingUrl.port = authUrl.port
    return new Request(incomingUrl, request)
}

async function handle(request: Request): Promise<Response> {
    return getRenterCheckAuthServer().handle(requestAtAuthOrigin(request))
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
