"use client";

import { createBrowserClient } from "mrjim-auth/nextjs";
import type { Session } from "mrjim-auth";

export function getRentercheckBrowserAuthClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_MRJIM_AUTH_URL!, process.env.NEXT_PUBLIC_MRJIM_AUTH_PUBLISHABLE_KEY!, {
    auth: { flowType: "pkce", storageKey: "rentercheck", persistSession: true, autoRefreshToken: true },
  });
}

export async function syncRentercheckServerSession(session: Session | null) {
  const response = await fetch("/auth/session", {
    method: session ? "PUT" : "DELETE",
    credentials: "include",
    ...(session ? {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session }),
    } : {}),
  });
  if (!response.ok) throw new Error("Server session synchronization failed");
}
