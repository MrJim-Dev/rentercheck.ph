import "server-only";

import { cookies, headers } from "next/headers";
import { createServerClient } from "mrjim-auth/nextjs/server";
import { applyAuthSessionCookieOptions, refreshAuthSessionIfNeeded } from "./session-policy";

export async function createMrJimRequestClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authUrl = process.env.MRJIM_AUTH_URL;
  const publishableKey = process.env.MRJIM_AUTH_PUBLISHABLE_KEY;
  if (!authUrl || !publishableKey) throw new Error("MRJIM_AUTH_URL and MRJIM_AUTH_PUBLISHABLE_KEY are required");
  const client = createServerClient(authUrl, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try { for (const { name, value, options } of values) cookieStore.set(name, value, applyAuthSessionCookieOptions(options)); } catch { /* server components cannot always set cookies */ }
      },
    },
    global: { headers: { "x-request-id": requestHeaders.get("x-request-id") ?? crypto.randomUUID() } },
    auth: { storageKey: "rentercheck" },
  });
  await refreshAuthSessionIfNeeded(client);
  return client;
}
