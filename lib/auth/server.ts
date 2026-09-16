import { cookies, headers } from "next/headers"
import { createServerClient, type CookieToSet } from "mrjim-auth/nextjs/server"
import type { MrJimAuthClient, User } from "mrjim-auth"
import { getRenterCheckAuthServer } from "@/lib/auth/auth-server"
import type { AuthIdentity } from "@/lib/auth/types"

function required(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`${name} is required for RenterCheck Auth.`)
    return value
}

function authUrl(): string {
    return process.env.MRJIM_AUTH_URL?.trim() || required("NEXT_PUBLIC_MRJIM_AUTH_URL")
}

function requestAtAuthOrigin(request: Request): Request {
    const configuredAuthUrl = process.env.MRJIM_AUTH_URL?.trim()
    if (!configuredAuthUrl) return request

    const incomingUrl = new URL(request.url)
    const authUrlValue = new URL(configuredAuthUrl)
    incomingUrl.protocol = authUrlValue.protocol
    incomingUrl.hostname = authUrlValue.hostname
    incomingUrl.port = authUrlValue.port

    return new Request(incomingUrl, request)
}

function localAuthFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init)
    const requestHeaders = new Headers(request.headers)
    if (!requestHeaders.has("origin")) {
        requestHeaders.set("origin", process.env.MRJIM_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    }
    return getRenterCheckAuthServer().handle(requestAtAuthOrigin(new Request(request, { headers: requestHeaders })))
}

export async function createMrJimAuthClient(): Promise<MrJimAuthClient> {
    const cookieStore = await cookies()
    const requestHeaders = await headers()
    return createServerClient(authUrl(), required("MRJIM_AUTH_PUBLISHABLE_KEY"), {
        cookies: {
            getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
            setAll: (values: readonly CookieToSet[]) => {
                try {
                    for (const { name, value, options } of values) cookieStore.set(name, value, options)
                } catch {
                    // Server Components cannot persist response cookies.
                }
            },
        },
        headers: {
            "x-request-id": requestHeaders.get("x-request-id") ?? crypto.randomUUID(),
        },
        auth: { storageKey: "rentercheck" },
        global: { fetch: localAuthFetch },
    })
}

function metadataString(metadata: Record<string, unknown> | undefined, key: string): string | null {
    return typeof metadata?.[key] === "string" && metadata[key] ? String(metadata[key]) : null
}

export function identityFromUser(user: User): AuthIdentity {
    const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>
    const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>
    const roles = Array.isArray(appMetadata.roles)
        ? appMetadata.roles.filter((role): role is string => typeof role === "string")
        : typeof appMetadata.roles === "string"
            ? appMetadata.roles.split(" ").map((role) => role.trim()).filter(Boolean)
            : []

    return {
        id: user.id,
        email: user.email ?? null,
        displayName: metadataString(userMetadata, "full_name") ?? metadataString(userMetadata, "name"),
        avatarUrl: metadataString(userMetadata, "avatar_url"),
        roles,
        provider: metadataString(appMetadata, "provider"),
        claims: {
            sub: user.id,
            ...(user.email ? { email: user.email } : {}),
            ...(roles.length ? { roles } : {}),
        },
    }
}

export async function getCurrentIdentity(): Promise<AuthIdentity | null> {
    const result = await (await createMrJimAuthClient()).auth.getUser()
    if (result.error || !result.data?.user) return null
    return identityFromUser(result.data.user)
}

export async function requireCurrentIdentity(): Promise<AuthIdentity> {
    const identity = await getCurrentIdentity()
    if (!identity) throw new Error("Not authenticated")
    return identity
}

export async function clearMrJimSession(): Promise<void> {
    await (await createMrJimAuthClient()).auth.signOut({ scope: "local" })
}
