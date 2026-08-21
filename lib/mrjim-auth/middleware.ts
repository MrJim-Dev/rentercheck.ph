import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "mrjim-auth/nextjs/server";
import { applyAuthSessionCookieOptions } from "@/lib/mrjim-auth/session-policy";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const authUrl = process.env.MRJIM_AUTH_URL;
  const publishableKey = process.env.MRJIM_AUTH_PUBLISHABLE_KEY;
  if (!authUrl || !publishableKey) return response;
  const auth = createServerClient(authUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, applyAuthSessionCookieOptions(options));
      },
    },
    auth: { storageKey: "rentercheck" },
  });
  if (request.nextUrl.pathname.startsWith("/auth/")) return response;
  const { data } = await auth.auth.getUser();
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/profile") || pathname.startsWith("/search-history");
  if (!data?.user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  if (data?.user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}
