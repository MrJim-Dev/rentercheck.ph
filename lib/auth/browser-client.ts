"use client"

import { createBrowserClient } from "mrjim-auth/nextjs"
import type { MrJimAuthClient } from "mrjim-auth"

let cachedClient: MrJimAuthClient | null = null

/** Browser-side MrJim Auth client for recovery and other public auth flows. */
export function createClient(): MrJimAuthClient {
    if (cachedClient) return cachedClient

    const authUrl = process.env.NEXT_PUBLIC_MRJIM_AUTH_URL?.trim()
        || (typeof window === "undefined" ? "http://127.0.0.1:3000/auth/v1" : `${window.location.origin}/auth/v1`)
    const publishableKey = process.env.NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY
        || (typeof window === "undefined" ? "rentercheck-build-placeholder" : undefined)

    cachedClient = createBrowserClient(authUrl, publishableKey, {
        auth: {
            flowType: "pkce",
            storageKey: "rentercheck",
            persistSession: true,
            autoRefreshToken: true,
        },
    })

    return cachedClient
}
