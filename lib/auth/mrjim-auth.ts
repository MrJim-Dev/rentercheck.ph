import type { AuthIdentity, ClientAuthUser } from "@/lib/auth/types"

export function toClientAuthUser(identity: AuthIdentity): ClientAuthUser {
    return {
        id: identity.id,
        email: identity.email,
        user_metadata: {
            ...(identity.displayName ? { full_name: identity.displayName } : {}),
            ...(identity.avatarUrl ? { avatar_url: identity.avatarUrl } : {}),
        },
        app_metadata: {
            ...(identity.roles.length ? { roles: identity.roles } : {}),
            ...(identity.provider ? { provider: identity.provider } : {}),
        },
    }
}
