import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

const getEnvValue = (name: string, fallback: string) => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
};

export const getApiKeyConfig = () => ({
  apiKey: getEnvValue("API_KEY", ""),
  rateLimitMaxRequests: Number(getEnvValue("API_KEY_RATE_LIMIT_MAX_REQUESTS", "30")),
  rateLimitWindowMs: Number(getEnvValue("API_KEY_RATE_LIMIT_WINDOW_MS", "60000")),
});

export const getApiKeyRateLimitState = () => RATE_LIMIT_STORE;

const getRateLimitKey = (req: NextRequest) => {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `${ip}:${req.nextUrl.pathname}`;
};

export const requireApiKeyAuth = (req: NextRequest) => {
  const { apiKey, rateLimitMaxRequests, rateLimitWindowMs } = getApiKeyConfig();

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is not configured on the server" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (providedToken !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = getRateLimitKey(req);
  const now = Date.now();
  const current = RATE_LIMIT_STORE.get(key);

  if (current && current.resetAt > now) {
    if (current.count >= rateLimitMaxRequests) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    RATE_LIMIT_STORE.set(key, {
      count: current.count + 1,
      resetAt: current.resetAt,
    });
    return null;
  }

  RATE_LIMIT_STORE.set(key, {
    count: 1,
    resetAt: now + rateLimitWindowMs,
  });

  return null;
};
