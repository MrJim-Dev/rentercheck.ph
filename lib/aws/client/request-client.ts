import "server-only";

import { cookies, headers } from "next/headers";
import { createServerClient } from "mrjim-auth/nextjs/server";
import { createDatabaseClient } from "./database-client";
import { createStorageCompatClient } from "../storage/service";

export async function createRequestClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authUrl = process.env.MRJIM_AUTH_URL;
  const publishableKey = process.env.MRJIM_AUTH_PUBLISHABLE_KEY;
  if (!authUrl || !publishableKey) throw new Error("MRJIM_AUTH_URL and MRJIM_AUTH_PUBLISHABLE_KEY are required");
  const auth = createServerClient(authUrl, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => { for (const { name, value, options } of values) cookieStore.set(name, value, options); },
    },
    global: { headers: { "x-request-id": requestHeaders.get("x-request-id") ?? crypto.randomUUID() } },
    auth: { storageKey: "rentercheck" },
  });
  const compatAuth = Object.freeze({
    ...auth.auth,
    async getUser(jwt?: string) {
      const result = await auth.auth.getUser(jwt);
      return { data: { user: result.error === null && result.data ? result.data.user : null }, error: result.error };
    },
    async getSession() {
      const result = await auth.auth.getSession();
      return { data: { session: result.error === null && result.data ? result.data.session : null }, error: result.error };
    },
  });
  let resolvedUserId: string | null | undefined;
  const getUserId = async () => {
    if (resolvedUserId !== undefined) return resolvedUserId;
    const result = await compatAuth.getUser();
    resolvedUserId = result.error === null ? result.data.user?.id ?? null : null;
    return resolvedUserId;
  };
  const database = createDatabaseClient({ getUserId });
  return Object.freeze({ auth: compatAuth, from: database.from.bind(database), rpc: database.rpc.bind(database), storage: createStorageCompatClient(), database });
}

export const createClient = createRequestClient;
