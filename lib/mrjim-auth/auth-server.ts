import "server-only";

import { createHash } from "node:crypto";
import { Pool } from "pg";
import { createPostgresAdapter } from "mrjim-auth/postgres";
import { createAuthServer, type MailMessage } from "mrjim-auth/server";
import { sendMrJimAuthEmail } from "@/lib/email";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for MrJim Auth`);
  return value;
}

function secret(name: string) {
  const value = Buffer.from(required(name), "base64url");
  if (value.byteLength < 32) throw new Error(`${name} must contain at least 32 bytes`);
  return new Uint8Array(value);
}

const state = globalThis as typeof globalThis & { rentercheckAuth?: ReturnType<typeof createAuthServer>; rentercheckAuthPool?: Pool };

function mailer() {
  return {
    async send(message: MailMessage) {
      const token = message.variables.token ?? message.variables.code;
      if (!token) throw new Error("MrJim Auth email token is missing");
      const siteUrl = required("NEXT_PUBLIC_SITE_URL").replace(/\/$/u, "");
      const fallback = message.template === "recovery" ? new URL("/update-password", siteUrl) : new URL("/auth/callback", siteUrl);
      const destination = new URL(message.variables.redirect ?? fallback.toString());
      destination.searchParams.set("email", message.to);
      destination.searchParams.set("token", token);
      destination.searchParams.set("flow", message.template === "confirmation" ? "confirmation" : message.template);
      const sent = await sendMrJimAuthEmail({
        to: message.to,
        subject: `RenterCheck ${message.template.replaceAll("_", " ")}`,
        actionUrl: destination.toString(),
        idempotencyKey: `rentercheck-auth/${message.template}/${createHash("sha256").update(`${message.to}\u0000${token}`).digest("hex")}`,
      });
      if (!sent.success) throw new Error(sent.error ?? "MrJim Auth email delivery failed");
    },
  };
}

export function getRentercheckAuthServer() {
  if (state.rentercheckAuth) return state.rentercheckAuth;
  const baseUrl = required("MRJIM_AUTH_URL");
  const siteUrl = required("NEXT_PUBLIC_SITE_URL").replace(/\/$/u, "");
  const pool = state.rentercheckAuthPool ?? new Pool({ connectionString: required("DATABASE_URL"), ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }, max: 3, application_name: "rentercheck-auth" });
  state.rentercheckAuthPool = pool;
  state.rentercheckAuth = createAuthServer({
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    baseUrl,
    siteUrl,
    database: createPostgresAdapter({ pool }),
    signingKeys: {
      issuer: baseUrl,
      audience: required("MRJIM_AUTH_TOKEN_AUDIENCE"),
      activeKeyId: required("MRJIM_AUTH_ES256_KEY_ID"),
      keys: { [required("MRJIM_AUTH_ES256_KEY_ID")]: JSON.parse(required("MRJIM_AUTH_ES256_PRIVATE_JWK")) as Record<string, unknown> },
    },
    secrets: { tokenHashKey: secret("MRJIM_AUTH_TOKEN_HASH_KEY"), encryptionKey: secret("MRJIM_AUTH_ENCRYPTION_KEY") },
    email: mailer(),
    redirects: { allowed: [`${siteUrl}/auth/callback`, `${siteUrl}/profile`, `${siteUrl}/update-password`] },
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 90 * 24 * 60 * 60,
  });
  return state.rentercheckAuth;
}
