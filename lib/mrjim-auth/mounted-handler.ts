import "server-only";

import { toNextRouteHandler } from "mrjim-auth/nextjs/route";
import { getRentercheckAuthServer } from "./auth-server";

async function canonicalizeAuthRequest(request: Request): Promise<Request> {
  const configuredUrl = process.env.MRJIM_AUTH_URL;
  if (!configuredUrl) return request;

  const configured = new URL(configuredUrl);
  const requestUrl = new URL(request.url);
  if (requestUrl.origin === configured.origin) return request;

  const canonicalUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, configured.origin);
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: new Headers(request.headers),
    body: method === "GET" || method === "HEAD" ? undefined : await request.clone().text(),
  };
  return new Request(canonicalUrl, init);
}

export function createMountedAuthHandler() {
  let handler: ReturnType<typeof toNextRouteHandler> | undefined;
  return async (request: Request) => {
    handler ??= toNextRouteHandler(getRentercheckAuthServer());
    return handler(await canonicalizeAuthRequest(request));
  };
}
