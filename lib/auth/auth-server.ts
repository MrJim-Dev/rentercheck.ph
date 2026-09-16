import "server-only"

import { createHash } from "node:crypto"
import { Resend } from "resend"
import { createPostgresAdapter } from "mrjim-auth/postgres"
import { createAuthServer, type MailMessage } from "mrjim-auth/server"
import { getDatabasePool } from "@/lib/db/pool"

function required(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`${name} is required for RenterCheck Auth.`)
    return value
}

function secret(name: string): Uint8Array {
    const value = Buffer.from(required(name), "base64url")
    if (value.byteLength < 32) throw new Error(`${name} must contain at least 32 bytes.`)
    return new Uint8Array(value)
}

function googleOAuth() {
    const clientId = process.env.MRJIM_AUTH_GOOGLE_CLIENT_ID?.trim()
    const clientSecret = process.env.MRJIM_AUTH_GOOGLE_CLIENT_SECRET?.trim()
    if (!clientId && !clientSecret) return undefined
    if (!clientId || !clientSecret) throw new Error("Both RenterCheck Google OAuth credentials are required.")
    return { google: { clientId, clientSecret } }
}

const state = globalThis as typeof globalThis & {
    renterCheckAuth?: ReturnType<typeof createAuthServer>
}

function mailer() {
    return {
        async send(message: MailMessage) {
            const resend = new Resend(required("RESEND_API_KEY"))
            const token = message.variables.token ?? message.variables.code
            if (!token) throw new Error("MrJim Auth email token is missing.")

            const siteUrl = required("MRJIM_SITE_URL").replace(/\/$/u, "")
            const fallbackPath = message.template === "recovery" ? "/update-password" : "/auth/callback"
            const destination = new URL(message.variables.redirect ?? `${siteUrl}${fallbackPath}`)
            destination.searchParams.set("email", message.to)
            destination.searchParams.set("token", token)
            destination.searchParams.set("flow", message.template === "confirmation" ? "signup" : message.template)

            const result = await resend.emails.send({
                from: required("MRJIM_AUTH_FROM_EMAIL"),
                to: message.to,
                subject: `RenterCheck ${message.template.replaceAll("_", " ")}`,
                html: `<p>Continue to RenterCheck:</p><p><a href="${destination.toString()}">Open RenterCheck</a></p>`,
                headers: {
                    "X-Entity-Ref-ID": `rentercheck-auth/${message.template}/${createHash("sha256").update(`${message.to}\u0000${token}`).digest("hex")}`,
                },
            })

            if (result.error) throw new Error(result.error.message || "MrJim Auth email delivery failed.")
        },
    }
}

export function getRenterCheckAuthServer() {
    if (state.renterCheckAuth) return state.renterCheckAuth

    const baseUrl = required("MRJIM_AUTH_URL").replace(/\/$/u, "")
    const siteUrl = required("MRJIM_SITE_URL").replace(/\/$/u, "")
    const keyId = required("MRJIM_AUTH_ES256_KEY_ID")
    const site = new URL(siteUrl)
    const redirectOrigins = new Set([site.origin])
    if (site.hostname.startsWith("www.")) {
        site.hostname = site.hostname.slice("www.".length)
        redirectOrigins.add(site.origin)
    }

    state.renterCheckAuth = createAuthServer({
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        baseUrl,
        siteUrl,
        database: createPostgresAdapter({ pool: getDatabasePool() }),
        signingKeys: {
            issuer: baseUrl,
            audience: required("MRJIM_AUTH_TOKEN_AUDIENCE"),
            activeKeyId: keyId,
            keys: { [keyId]: JSON.parse(required("MRJIM_AUTH_ES256_PRIVATE_JWK")) as Record<string, unknown> },
        },
        secrets: {
            tokenHashKey: secret("MRJIM_AUTH_TOKEN_HASH_KEY"),
            encryptionKey: secret("MRJIM_AUTH_ENCRYPTION_KEY"),
        },
        email: mailer(),
        ...(googleOAuth() ? { oauth: googleOAuth() } : {}),
        redirects: {
            allowed: [...redirectOrigins].flatMap((origin) => [
                `${origin}/auth/callback`,
                `${origin}/api/auth/callback`,
                `${origin}/login`,
                `${origin}/signup`,
                `${origin}/update-password`,
                `${origin}/dashboard`,
                `${origin}/my-reports`,
                origin,
            ]),
        },
        requireEmailConfirmation: false,
        accessTokenTtlSeconds: 900,
        refreshTokenTtlSeconds: 90 * 24 * 60 * 60,
    })

    return state.renterCheckAuth
}
