import "server-only";

import { Pool, type PoolConfig, type QueryResultRow } from "pg";

type GlobalDatabaseState = typeof globalThis & {
  rentercheckPool?: Pool;
};

function sslConfig(): PoolConfig["ssl"] {
  const ca = process.env.DATABASE_SSL_CA?.trim();
  if (ca) return { ca, rejectUnauthorized: true };
  if (process.env.DATABASE_SSL === "false") return false;
  return { rejectUnauthorized: false };
}

export function getDatabase(): Pool {
  const state = globalThis as GlobalDatabaseState;
  if (state.rentercheckPool) return state.rentercheckPool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required");
  state.rentercheckPool = new Pool({
    connectionString,
    ssl: sslConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 4),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: "rentercheck-web",
  });
  return state.rentercheckPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: readonly unknown[] = []) {
  return getDatabase().query<T>(text, values as unknown[]);
}

export async function closeDatabase() {
  const state = globalThis as GlobalDatabaseState;
  const pool = state.rentercheckPool;
  state.rentercheckPool = undefined;
  await pool?.end();
}
