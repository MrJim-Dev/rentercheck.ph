import type { Session } from "mrjim-auth";
import type { CookieOptions } from "mrjim-auth/nextjs/server";

export const AUTH_SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
export const AUTH_SESSION_COOKIE_PREFIX = "mrjim-auth-rentercheck.";

export function applyAuthSessionCookieOptions(options: CookieOptions): CookieOptions {
  if (options.maxAge === 0) return options;
  return { ...options, maxAge: AUTH_SESSION_MAX_AGE_SECONDS };
}

export function isAuthSessionCookie(name: string) { return name.startsWith(AUTH_SESSION_COOKIE_PREFIX); }

type AuthSessionClient = { auth: { getSession: () => Promise<{ data: { session: Session | null } | null; error: unknown }>; refreshSession: (session: Session) => Promise<unknown> } };

export async function refreshAuthSessionIfNeeded(client: AuthSessionClient, now = Date.now()) {
  const result = await client.auth.getSession();
  const session = result.data?.session;
  if (!session || session.expires_at > Math.floor(now / 1000) + 60) return result;
  return client.auth.refreshSession(session);
}
