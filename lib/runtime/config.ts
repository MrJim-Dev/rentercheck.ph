export type RuntimeProvider = "mrjim"

const DEFAULT_RUNTIME_PROVIDER: RuntimeProvider = "mrjim"

/**
 * Selects the AWS application boundary without reading any credentials.
 * Supabase is no longer a supported runtime provider.
 */
export function getRuntimeProvider(): RuntimeProvider {
    const configured = process.env.RENTERCHECK_RUNTIME?.trim().toLowerCase()

    if (!configured) return DEFAULT_RUNTIME_PROVIDER
    if (configured === "mrjim") return configured

    throw new Error("Invalid RENTERCHECK_RUNTIME. Expected 'mrjim'.")
}

export function isMrJimRuntime(): boolean {
    return getRuntimeProvider() === "mrjim"
}

/**
 * Reads a server-only setting by name and never includes its value in an
 * error. This keeps deployment diagnostics useful without leaking secrets.
 */
export function requireServerEnv(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`Missing required server environment variable: ${name}`)
    return value
}

export function parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    maximum = Number.MAX_SAFE_INTEGER,
): number {
    if (!value) return fallback

    const parsed = Number.parseInt(value, 10)
    if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback
    return Math.min(parsed, maximum)
}
