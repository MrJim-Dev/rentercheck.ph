import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { createPostgresAdapter, migrate } from "mrjim-auth/postgres";
import { ApiKeyService } from "mrjim-auth/server";
import { Pool } from "pg";
import sharp from "sharp";

const region = process.env.AWS_REGION ?? "ap-southeast-1";
const bucket = required("MIGRATION_BUCKET");
const evidencePrefix = process.env.EVIDENCE_PREFIX ?? "evidence";
const targetDatabase = process.env.TARGET_DATABASE ?? "rentercheck";
const sourcePayloadKey = process.env.SOURCE_PAYLOAD_KEY ?? "migration/rentercheck-source.json";
const manifestKey = process.env.MANIFEST_KEY ?? "migration/manifest.json";
const s3 = new S3Client({ region });
const secrets = new SecretsManagerClient({ region });

let targetPool;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function safeIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value)) throw new Error("Database identifier is malformed");
  return `"${value}"`;
}

async function readSecret() {
  const result = await secrets.send(new GetSecretValueCommand({ SecretId: required("RDS_SECRET_ARN") }));
  const raw = result.SecretString ?? Buffer.from(result.SecretBinary ?? "", "base64").toString("utf8");
  if (!raw) throw new Error("RDS secret is empty");
  const value = JSON.parse(raw);
  value.host ??= process.env.RDS_HOST;
  value.port ??= process.env.RDS_PORT ?? "5432";
  value.dbname ??= process.env.RDS_ADMIN_DATABASE ?? "mrjim";
  if (!value.host || !value.username || !value.password) throw new Error("RDS connection configuration is incomplete");
  return value;
}

function poolFor(secret, database) {
  return new Pool({
    host: secret.host,
    port: Number(secret.port ?? 5432),
    user: secret.username,
    password: secret.password,
    database,
    ssl: { rejectUnauthorized: false },
    max: 4,
    application_name: "rentercheck-migration",
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

async function ensureDatabase(secret) {
  const adminPool = poolFor(secret, process.env.RDS_ADMIN_DATABASE ?? secret.dbname ?? "mrjim");
  const client = await adminPool.connect();
  try {
    try {
      await client.query(`CREATE DATABASE ${safeIdentifier(targetDatabase)}`);
    } catch (error) {
      if (error?.code !== "42P04") throw error;
    }
  } finally {
    client.release();
    await adminPool.end();
  }
}

async function getTargetPool() {
  if (targetPool) return targetPool;
  const secret = await readSecret();
  await ensureDatabase(secret);
  targetPool = poolFor(secret, targetDatabase);
  return targetPool;
}

async function textFromBody(body) {
  if (!body) throw new Error("S3 object has no body");
  if (typeof body.transformToString === "function") return body.transformToString();
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function bytesFromBody(body) {
  if (!body) throw new Error("S3 object has no body");
  if (typeof body.transformToByteArray === "function") return Uint8Array.from(await body.transformToByteArray());
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return new Uint8Array(Buffer.concat(chunks));
}

async function getObject(key) {
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return bytesFromBody(result.Body);
}

async function getJson(key) {
  return JSON.parse(await textFromBody((await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))).Body));
}

async function putObject(key, body, contentType, metadata = {}) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentLength: body.byteLength,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: metadata,
    ServerSideEncryption: "AES256",
  }));
}

async function applySchema(pool) {
  await migrate(pool, { direction: "up" });
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

const publicTables = [
  "report_group_members", "report_groups", "search_access_logs", "credit_transactions", "credit_wallets",
  "dispute_evidence", "incident_disputes", "report_info_requests", "report_admin_actions", "report_edits",
  "report_evidence", "report_amendments", "report_identifiers", "renter_identifiers", "incident_reports",
  "renters", "admin_users", "credit_action_costs", "users",
];

const primaryKeys = {
  users: ["id"],
  admin_users: ["id"],
  renters: ["id"],
  renter_identifiers: ["id"],
  incident_reports: ["id"],
  report_identifiers: ["id"],
  report_evidence: ["id"],
  report_amendments: ["id"],
  report_edits: ["id"],
  report_admin_actions: ["id"],
  report_info_requests: ["id"],
  incident_disputes: ["id"],
  dispute_evidence: ["id"],
  credit_action_costs: ["action_key"],
  credit_wallets: ["id"],
  credit_transactions: ["id"],
  search_access_logs: ["id"],
  report_groups: ["id"],
  report_group_members: ["id"],
};

function quote(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function columnsFor(client, table) {
  const result = await client.query(
    "select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position",
    [table],
  );
  return new Map(result.rows.map((row) => [row.column_name, row.data_type]));
}

async function insertPublicRows(client, table, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const allowed = await columnsFor(client, table);
  const keys = primaryKeys[table];
  if (!keys) throw new Error(`No migration key configured for ${table}`);
  const normalized = rows.map((row) => {
    const filtered = Object.fromEntries(Object.entries(row).filter(([key]) => allowed.has(key)));
    for (const key of keys) if (!(key in filtered)) throw new Error(`Missing ${table}.${key}`);
    return filtered;
  });
  const columns = Object.keys(normalized[0]);
  if (!columns.length) return 0;
  const updateColumns = columns.filter((column) => !keys.includes(column));
  const conflict = keys.map(quote).join(", ");
  for (let start = 0; start < normalized.length; start += 100) {
    const batch = normalized.slice(start, start + 100);
    const values = [];
    const tuples = batch.map((row) => `(${columns.map((column) => {
      const value = row[column] == null ? null : allowed.get(column) === "jsonb" ? JSON.stringify(row[column]) : row[column];
      values.push(value);
      return allowed.get(column) === "jsonb" ? `$${values.length}::jsonb` : `$${values.length}`;
    }).join(", ")})`).join(", ");
    const updates = updateColumns.length
      ? `DO UPDATE SET ${updateColumns.map((column) => `${quote(column)} = EXCLUDED.${quote(column)}`).join(", ")}`
      : "DO NOTHING";
    await client.query(`INSERT INTO public.${quote(table)} (${columns.map(quote).join(", ")}) VALUES ${tuples} ON CONFLICT (${conflict}) ${updates}`, values);
  }
  return normalized.length;
}

async function insertAuthUsers(client, rows) {
  const sql = `INSERT INTO auth.users
    (id, email, email_normalized, phone, phone_normalized, email_confirmed_at, phone_confirmed_at,
     last_sign_in_at, user_metadata, app_metadata, created_at, updated_at, deleted_at)
    VALUES ($1::uuid, $2, lower(nullif(btrim($2), '')), $3, nullif(btrim($3), ''), $4, $5, $6,
      $7::jsonb, $8::jsonb, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email, email_normalized = EXCLUDED.email_normalized,
      phone = EXCLUDED.phone, phone_normalized = EXCLUDED.phone_normalized,
      email_confirmed_at = EXCLUDED.email_confirmed_at, phone_confirmed_at = EXCLUDED.phone_confirmed_at,
      last_sign_in_at = EXCLUDED.last_sign_in_at, user_metadata = EXCLUDED.user_metadata,
      app_metadata = EXCLUDED.app_metadata, created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at, deleted_at = EXCLUDED.deleted_at`;
  for (const row of rows) {
    await client.query(sql, [
      row.id, row.email ?? null, row.phone ?? null, row.email_confirmed_at ?? row.confirmed_at ?? null,
      row.phone_confirmed_at ?? null, row.last_sign_in_at ?? null,
      JSON.stringify(row.user_metadata && typeof row.user_metadata === "object" ? row.user_metadata : {}),
      JSON.stringify(row.app_metadata && typeof row.app_metadata === "object" ? row.app_metadata : {}),
      row.created_at, row.updated_at ?? row.created_at, row.deleted_at ?? null,
    ]);
  }
  return rows.length;
}

async function insertAuthIdentities(client, rows) {
  const sql = `INSERT INTO auth.identities
    (id, user_id, provider, provider_subject, email, email_normalized, identity_data, created_at, updated_at)
    VALUES ($1::uuid, $2::uuid, lower(btrim($3)), $4, $5, lower(nullif(btrim($5), '')), $6::jsonb, $7, $8)
    ON CONFLICT (provider, provider_subject) DO UPDATE SET
      user_id = EXCLUDED.user_id, email = EXCLUDED.email, email_normalized = EXCLUDED.email_normalized,
      identity_data = EXCLUDED.identity_data, updated_at = EXCLUDED.updated_at`;
  for (const row of rows) {
    const data = row.identity_data && typeof row.identity_data === "object" ? row.identity_data : {};
    const subject = String(row.provider_id ?? data.sub ?? row.id);
    await client.query(sql, [row.id, row.user_id, row.provider ?? "email", subject, row.email ?? null, JSON.stringify(data), row.created_at, row.updated_at ?? row.created_at]);
  }
  return rows.length;
}

const bcryptHash = /^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/u;

async function insertPasswordCredentials(client, rows) {
  let imported = 0;
  let unsupported = 0;
  for (const row of rows) {
    const hash = typeof row.encrypted_password === "string" ? row.encrypted_password : "";
    if (!hash) continue;
    if (!bcryptHash.test(hash)) { unsupported++; continue; }
    await client.query(`INSERT INTO auth.password_credentials (user_id, password_hash, password_updated_at)
      VALUES ($1::uuid, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, password_updated_at = EXCLUDED.password_updated_at`,
    [row.id, hash, row.updated_at ?? row.created_at]);
    imported++;
  }
  return { imported, unsupported };
}

async function clearPublicState(client) {
  await client.query(`TRUNCATE TABLE ${publicTables.map((table) => `public.${quote(table)}`).join(", ")} CASCADE`);
}

async function clearMigrationState(client) {
  await clearPublicState(client);
  await client.query("TRUNCATE TABLE auth.refresh_tokens, auth.sessions, auth.one_time_tokens, auth.oauth_states, auth.password_credentials, auth.identities CASCADE");
  await client.query("DELETE FROM auth.users");
}

async function verifyEvidence(manifest, evidenceRows) {
  const expected = new Map((manifest.objects ?? []).map((item) => [item.destinationKey, item]));
  const bytesByKey = new Map();
  const objects = manifest.objects ?? [];
  let totalBytes = 0;
  let checked = 0;
  const concurrency = 8;
  for (let start = 0; start < objects.length; start += concurrency) {
    const batch = objects.slice(start, start + concurrency);
    await Promise.all(batch.map(async (item) => {
      const bytes = await getObject(item.destinationKey);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (bytes.byteLength !== item.bytes || sha256 !== item.sha256) throw new Error(`Evidence checksum mismatch for ${item.destinationKey}`);
      bytesByKey.set(item.destinationKey, bytes);
      totalBytes += bytes.byteLength;
      checked++;
    }));
  }
  let variants = 0;
  let imageRows = 0;
  for (const row of evidenceRows) {
    const mime = String(row.mime_type ?? "").toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) continue;
    const sourceKey = `${evidencePrefix}/${row.storage_path}`;
    const source = bytesByKey.get(sourceKey);
    const item = expected.get(sourceKey);
    if (!source || !item) throw new Error(`Evidence object missing from manifest: ${sourceKey}`);
    imageRows++;
    const image = sharp(source, { failOn: "error" });
    const metadata = await image.metadata();
    if ((metadata.width ?? 0) > 12_000 || (metadata.height ?? 0) > 12_000) throw new Error(`Evidence image is too large: ${sourceKey}`);
    const display = await image.clone().rotate().resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const thumb = await image.clone().rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const sourceHash = createHash("sha256").update(source).digest("hex");
    await putObject(`${sourceKey}.display.webp`, display, "image/webp", { "source-sha256": sourceHash, variant: "display" });
    await putObject(`${sourceKey}.thumb.webp`, thumb, "image/webp", { "source-sha256": sourceHash, variant: "thumb" });
    variants += 2;
  }
  return { checked, totalBytes, imageRows, variants };
}

async function importPayload(pool) {
  const payload = await getJson(sourcePayloadKey);
  if (!payload?.auth?.users || !payload?.public) throw new Error("Migration payload is malformed");
  const manifest = await getJson(manifestKey);
  const client = await pool.connect();
  const summary = { authUsers: 0, identities: 0, passwords: 0, unsupportedPasswords: 0, publicRows: {}, evidence: null };
  try {
    await client.query("BEGIN");
    await clearMigrationState(client);
    summary.authUsers = await insertAuthUsers(client, payload.auth.users);
    summary.identities = await insertAuthIdentities(client, payload.auth.identities ?? []);
    const passwords = await insertPasswordCredentials(client, payload.auth.users);
    summary.passwords = passwords.imported;
    summary.unsupportedPasswords = passwords.unsupported;
    // MrJim Auth's user-created trigger provisions a temporary profile and
    // wallet. Remove those trigger side effects before restoring the source
    // public rows, which may have different wallet IDs and may intentionally
    // omit a profile for an auth-only user.
    await clearPublicState(client);
    for (const table of publicTables.slice().reverse()) {
      summary.publicRows[table] = await insertPublicRows(client, table, payload.public[table] ?? []);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  summary.evidence = await verifyEvidence(manifest, payload.public.report_evidence ?? []);
  const evidenceClient = await pool.connect();
  try {
    await evidenceClient.query("BEGIN");
    for (const row of payload.public.report_evidence ?? []) {
      const mime = String(row.mime_type ?? "").toLowerCase();
      if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime)) {
        await evidenceClient.query("UPDATE public.report_evidence SET thumbnail_path = $1 WHERE id = $2::uuid", [`${row.storage_path}.thumb.webp`, row.id]);
      }
    }
    await evidenceClient.query("COMMIT");
  } catch (error) {
    await evidenceClient.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    evidenceClient.release();
  }
  return { ...summary, verified: await verifyCounts(pool, payload) };
}

async function verifyCounts(pool, payload) {
  const client = await pool.connect();
  try {
    const publicCounts = {};
    for (const table of publicTables.slice().reverse()) {
      const result = await client.query(`SELECT count(*)::int AS count FROM public.${quote(table)}`);
      publicCounts[table] = { expected: (payload.public[table] ?? []).length, actual: result.rows[0].count };
    }
    const authUsers = Number((await client.query("SELECT count(*)::int AS count FROM auth.users")).rows[0].count);
    const identities = Number((await client.query("SELECT count(*)::int AS count FROM auth.identities")).rows[0].count);
    const sessions = Number((await client.query("SELECT count(*)::int AS count FROM auth.sessions")).rows[0].count);
    const refreshTokens = Number((await client.query("SELECT count(*)::int AS count FROM auth.refresh_tokens")).rows[0].count);
    return { authUsers: { expected: payload.auth.users.length, actual: authUsers }, identities: { expected: (payload.auth.identities ?? []).length, actual: identities }, sessions, refreshTokens, publicCounts };
  } finally {
    client.release();
  }
}

async function generatePublishableKey(pool) {
  const hashKey = Buffer.from(required("MRJIM_AUTH_API_KEY_HASH_KEY"), "base64url");
  if (hashKey.byteLength !== 32) throw new Error("MRJIM_AUTH_API_KEY_HASH_KEY must encode 32 bytes");
  const adapter = createPostgresAdapter({ pool });
  if (!adapter.admin) throw new Error("MrJim Auth admin repository is unavailable");
  const service = new ApiKeyService({
    store: {
      create: (input) => adapter.admin.createApiKey(input),
      list: (input = { page: 1, perPage: 50 }) => adapter.admin.listApiKeys(input),
      revoke: (id, revokedAt) => adapter.admin.revokeApiKey(id, revokedAt),
      touchLastUsed: (id, usedAt) => adapter.admin.touchApiKeyLastUsed(id, usedAt),
    },
    hashKey: Uint8Array.from(hashKey),
  });
  const result = await service.generate({ kind: "publishable", name: "rentercheck-web", scopes: ["auth.public"] });
  if (result.error !== null) throw new Error("Publishable key generation failed");
  return { key: result.data.key, record: result.data.apiKey };
}

export async function handler(event = {}) {
  const mode = typeof event === "string" ? JSON.parse(event).mode : event.mode;
  const pool = await getTargetPool();
  if (mode === "prepare") {
    await applySchema(pool);
    return { ok: true, mode, database: targetDatabase };
  }
  if (mode === "import") {
    await applySchema(pool);
    return { ok: true, mode, database: targetDatabase, ...(await importPayload(pool)) };
  }
  if (mode === "verify") {
    const payload = await getJson(sourcePayloadKey);
    return { ok: true, mode, database: targetDatabase, verified: await verifyCounts(pool, payload) };
  }
  if (mode === "generate-publishable-key") return { ok: true, mode, ...(await generatePublishableKey(pool)) };
  throw new Error("Unsupported migration mode");
}

export const runtime = "nodejs24.x";
