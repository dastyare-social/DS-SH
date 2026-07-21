import { NextRequest } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { requireApiKeyAuth } from "@/lib/auth/api-key";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

// Paths served by the openAPI() plugin docs UI — must stay public so browsers
// can load the Scalar reference UI without an API key.
const PUBLIC_DOCS_PATHS = new Set([
  "/api/auth/docs",
  "/api/auth/open-api/generate-schema",
]);

// Core browser-facing auth flows. These use session cookies for security and
// are not external API endpoints, so they must remain accessible without an
// API key (the login page, session refresh, sign-out, etc. all hit these).
const PUBLIC_AUTH_PREFIXES = [
  "/api/auth/sign-in/",
  "/api/auth/sign-out",
  "/api/auth/get-session",
  "/api/auth/session",
];

const isPublicAuthPath = (pathname: string) =>
  PUBLIC_DOCS_PATHS.has(pathname) ||
  PUBLIC_AUTH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export async function GET(req: NextRequest) {
  if (!isPublicAuthPath(req.nextUrl.pathname)) {
    const denied = requireApiKeyAuth(req);
    if (denied) return denied;
  }
  return authGet(req);
}

export async function POST(req: NextRequest) {
  if (!isPublicAuthPath(req.nextUrl.pathname)) {
    const denied = requireApiKeyAuth(req);
    if (denied) return denied;
  }
  return authPost(req);
}