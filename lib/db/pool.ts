import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"
import { parsePositiveInteger, requireServerEnv } from "@/lib/runtime/config"

export interface DatabaseRequestContext {
    readonly userId?: string | null
    readonly role?: "anon" | "authenticated"
}

declare global {
    var __renterCheckPgPool: Pool | undefined
}

function createPool(): Pool {
    const sslDisabled = process.env.MRJIM_DATABASE_SSL?.trim().toLowerCase() === "disable"
    const rejectUnauthorized = process.env.MRJIM_DATABASE_SSL_REJECT_UNAUTHORIZED !== "false"
    const ca = process.env.MRJIM_DB_SSL_CA?.trim()
        || (process.env.MRJIM_DB_SSL_CA_BASE64?.trim()
            ? Buffer.from(process.env.MRJIM_DB_SSL_CA_BASE64.trim(), "base64").toString("utf8").trim()
            : undefined)

    if (!sslDisabled && !ca) {
        throw new Error("MRJIM_DB_SSL_CA must contain the verified RDS CA bundle")
    }
    if (!sslDisabled && !rejectUnauthorized) {
        throw new Error("MRJIM_DATABASE_SSL_REJECT_UNAUTHORIZED=false is not permitted for the AWS PostgreSQL target")
    }

    const configuredConnectionString = requireServerEnv("MRJIM_DATABASE_URL")
    let connectionString: string
    try {
        const parsed = new URL(configuredConnectionString)
        // node-postgres lets URL sslmode parameters override the explicit
        // `ssl` object. Remove those URL-level knobs so the verified RDS CA
        // below remains authoritative and cannot silently downgrade TLS.
        parsed.searchParams.delete("sslmode")
        parsed.searchParams.delete("sslrootcert")
        parsed.searchParams.delete("sslcert")
        parsed.searchParams.delete("sslkey")
        connectionString = parsed.toString()
    } catch {
        throw new Error("MRJIM_DATABASE_URL must be a valid PostgreSQL URL")
    }

    return new Pool({
        connectionString,
        // Vercel creates multiple short-lived isolates. Keep each isolate's
        // pool small unless the deployment has an explicit pooler in front of
        // PostgreSQL and has sized this value accordingly.
        max: parsePositiveInteger(process.env.MRJIM_DATABASE_POOL_MAX, 3, 10),
        idleTimeoutMillis: parsePositiveInteger(process.env.MRJIM_DATABASE_IDLE_TIMEOUT_MS, 10_000),
        connectionTimeoutMillis: parsePositiveInteger(process.env.MRJIM_DATABASE_CONNECTION_TIMEOUT_MS, 5_000),
        ssl: sslDisabled ? false : { rejectUnauthorized: true, ca },
        allowExitOnIdle: true,
    })
}

/** Server-only PostgreSQL pool for the MrJim runtime. */
export function getDatabasePool(): Pool {
    if (!globalThis.__renterCheckPgPool) {
        globalThis.__renterCheckPgPool = createPool()
    }

    return globalThis.__renterCheckPgPool
}

export function query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
): Promise<QueryResult<Row>> {
    return getDatabasePool().query<Row>(text, values)
}

export async function withTransaction<Result>(
    callback: (client: PoolClient) => Promise<Result>,
    context: DatabaseRequestContext = {},
): Promise<Result> {
    const client = await getDatabasePool().connect()

    try {
        await client.query("BEGIN")
        await client.query("SELECT set_config('app.user_id', $1, true), set_config('app.role', $2, true)", [context.userId ?? "", context.role ?? "anon"])
        const result = await callback(client)
        await client.query("COMMIT")
        return result
    } catch (error) {
        try {
            await client.query("ROLLBACK")
        } catch {
            // Preserve the original error. The rollback failure is not safe
            // to expose because it can contain connection details.
        }
        throw error
    } finally {
        client.release()
    }
}

/**
 * Execute a request-scoped callback with the identity context consumed by
 * the migrated RLS policies. The settings are LOCAL to this transaction and
 * cannot leak to another Vercel request that reuses the pool.
 */
export function withRequestContext<Result>(
    context: DatabaseRequestContext,
    callback: (client: PoolClient) => Promise<Result>,
): Promise<Result> {
    return withTransaction(callback, { ...context, role: context.userId ? (context.role ?? "authenticated") : "anon" })
}

export async function closeDatabasePool(): Promise<void> {
    if (!globalThis.__renterCheckPgPool) return

    const pool = globalThis.__renterCheckPgPool
    globalThis.__renterCheckPgPool = undefined
    await pool.end()
}
