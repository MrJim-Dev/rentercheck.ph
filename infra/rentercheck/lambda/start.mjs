import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

function assignSecretValues(rawSecret, label) {
  let values;
  try {
    values = JSON.parse(rawSecret);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error(`${label} must be a JSON object`);
  for (const [name, value] of Object.entries(values)) {
    if (!/^[A-Z][A-Z0-9_]*$/u.test(name) || typeof value !== "string") throw new Error(`${label} contains an invalid environment value`);
    process.env[name] = value;
  }
}

async function readSecret(client, secretId, label) {
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  const rawSecret = response.SecretString ?? (response.SecretBinary ? Buffer.from(response.SecretBinary).toString("utf8") : undefined);
  if (!rawSecret) throw new Error(`${label} is empty`);
  return rawSecret;
}

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
const runtimeSecretArn = process.env.RENTERCHECK_RUNTIME_SECRET_ARN;
if (runtimeSecretArn) assignSecretValues(await readSecret(client, runtimeSecretArn, "RenterCheck runtime secret"), "RenterCheck runtime secret");

if (!process.env.DATABASE_URL && process.env.RDS_SECRET_ARN) {
  const rds = JSON.parse(await readSecret(client, process.env.RDS_SECRET_ARN, "RDS secret"));
  const host = rds.host ?? process.env.RDS_HOST;
  const port = Number(rds.port ?? process.env.RDS_PORT ?? 5432);
  const database = rds.dbname ?? process.env.RDS_DATABASE ?? "rentercheck";
  if (!host || !rds.username || !rds.password) throw new Error("RDS connection configuration is incomplete");
  const connection = new URL(`postgresql://${encodeURIComponent(rds.username)}:${encodeURIComponent(rds.password)}@${host}:${port}/${encodeURIComponent(database)}`);
  process.env.DATABASE_URL = connection.toString();
}

process.env.NODE_ENV ??= "production";
process.env.PORT ??= "3000";
process.env.HOSTNAME ??= "0.0.0.0";

await import(new URL("./server.js", import.meta.url));
