import { NextResponse } from "next/server";
import { createServerClient, type Cookie, type CookieToSet } from "mrjim-auth/nextjs/server";
import type { Session } from "mrjim-auth";
import { WelcomeEmail } from "@/components/emails/welcome-email";
import { sendEmail } from "@/lib/email";
import { applyAuthSessionCookieOptions } from "@/lib/mrjim-auth/session-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_PREFIX = "mrjim-auth-rentercheck.";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readCookies(request: Request): Cookie[] {
  const header = request.headers.get("cookie");
  if (!header) return [];
  return header.split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator <= 0) return [];
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    return name ? [{ name, value }] : [];
  });
}

function createRouteAuthClient(request: Request, writes: CookieToSet[]) {
  const authUrl = required("MRJIM_AUTH_URL");
  const publishableKey = required("MRJIM_AUTH_PUBLISHABLE_KEY");
  return createServerClient(authUrl, publishableKey, {
    cookies: {
      getAll: () => readCookies(request),
      setAll: (values) => { writes.push(...values); },
    },
    global: {
      headers: {
        "x-request-id": request.headers.get("x-request-id") ?? crypto.randomUUID(),
      },
    },
    auth: { storageKey: "rentercheck" },
  });
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function attachCookies(response: NextResponse, writes: readonly CookieToSet[]) {
  for (const cookie of writes) {
    response.cookies.set(cookie.name, cookie.value, applyAuthSessionCookieOptions(cookie.options));
  }
  return noStore(response);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Authentication request failed";
}

export async function POST(request: Request) {
  const writes: CookieToSet[] = [];
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action === "signup" ? "signup" : "login";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return noStore(NextResponse.json({ error: "Email and password are required" }, { status: 400 }));

    const client = createRouteAuthClient(request, writes);
    if (action === "signup") {
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
      const result = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          redirectTo: `${required("NEXT_PUBLIC_SITE_URL").replace(/\/$/u, "")}/auth/callback`,
        },
      });
      if (result.error !== null) return noStore(NextResponse.json({ error: result.error.message }, { status: 400 }));
      await sendEmail({ to: email, subject: "Welcome to RenterCheck!", react: WelcomeEmail({ name: fullName }) });
      return attachCookies(NextResponse.json({ user: result.data.user, session: result.data.session }), writes);
    }

    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error !== null) return noStore(NextResponse.json({ error: result.error.message }, { status: 401 }));
    return attachCookies(NextResponse.json({ user: result.data.user, session: result.data.session }), writes);
  } catch (error) {
    return noStore(NextResponse.json({ error: errorMessage(error) }, { status: 500 }));
  }
}

export async function PUT(request: Request) {
  const writes: CookieToSet[] = [];
  try {
    const body = await request.json() as { session?: Session };
    if (!body.session) return noStore(NextResponse.json({ error: "Session is required" }, { status: 400 }));
    const client = createRouteAuthClient(request, writes);
    const result = await client.auth.setSession(body.session);
    if (result.error !== null) return noStore(NextResponse.json({ error: result.error.message }, { status: 401 }));
    return attachCookies(NextResponse.json({ user: result.data.user }), writes);
  } catch (error) {
    return noStore(NextResponse.json({ error: errorMessage(error) }, { status: 500 }));
  }
}

export async function DELETE(request: Request) {
  const response = noStore(new NextResponse(null, { status: 204 }));
  const names = readCookies(request)
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith(COOKIE_PREFIX));
  const namesToClear = names.length > 0 ? names : [`${COOKIE_PREFIX}0`];
  for (const name of namesToClear) {
    response.cookies.set(name, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  }
  return response;
}
