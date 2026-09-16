export interface AuthIdentity {
    /** Stable UUID issued by mrjim-auth and reused by RenterCheck. */
    id: string
    email: string | null
    displayName: string | null
    avatarUrl: string | null
    roles: string[]
    provider: string | null
    /** Signed claims retained for server-side authorization decisions. */
    claims: Record<string, unknown>
}

export interface ClientAuthUser {
    id: string
    email: string | null
    user_metadata: {
        full_name?: string
        avatar_url?: string
    }
    app_metadata: {
        roles?: string[]
        provider?: string
    }
}

// Accept all RFC 4122 UUID versions, including newer v7 identities.
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
    return UUID_PATTERN.test(value)
}
