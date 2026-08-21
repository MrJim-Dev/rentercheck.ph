"use client";

import { createBrowserClient } from "mrjim-auth/nextjs";

export function getRentercheckBrowserAuthClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_MRJIM_AUTH_URL!, process.env.NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY!, {
    auth: { flowType: "pkce", storageKey: "rentercheck", persistSession: true, autoRefreshToken: true },
  });
}
