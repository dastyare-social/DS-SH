import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import {
  getApiKeyConfig,
  getApiKeyRateLimitState,
  requireApiKeyAuth,
} from "./api-key";

const originalEnv = { ...process.env };

afterEach(() => {
  getApiKeyRateLimitState().clear();
  process.env = { ...originalEnv };
});

function makeRequest(url = "http://localhost:2947/api/links") {
  return new NextRequest(url);
}

describe("getApiKeyConfig", () => {
  test("falls back to defaults when env vars are missing", () => {
    delete process.env.API_KEY;
    delete process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.API_KEY_RATE_LIMIT_WINDOW_MS;

    const config = getApiKeyConfig();
    expect(config.apiKey).toBe("");
    expect(config.rateLimitMaxRequests).toBe(30);
    expect(config.rateLimitWindowMs).toBe(60000);
  });

  test("reads values from env", () => {
    process.env.API_KEY = "secret-key";
    process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS = "10";
    process.env.API_KEY_RATE_LIMIT_WINDOW_MS = "5000";

    const config = getApiKeyConfig();
    expect(config.apiKey).toBe("secret-key");
    expect(config.rateLimitMaxRequests).toBe(10);
    expect(config.rateLimitWindowMs).toBe(5000);
  });
});

describe("requireApiKeyAuth", () => {
  test("returns 500 when API key is not configured", () => {
    delete process.env.API_KEY;

    const res = requireApiKeyAuth(makeRequest());
    expect(res?.status).toBe(500);
  });

  test("rejects missing or invalid tokens", () => {
    process.env.API_KEY = "correct-key";

    expect(requireApiKeyAuth(makeRequest())?.status).toBe(401);
    expect(
      requireApiKeyAuth(makeRequest("http://localhost:2947/api/links"))?.status,
    ).toBe(401);
  });

  test("accepts a valid Bearer token", () => {
    process.env.API_KEY = "correct-key";

    const req = makeRequest("http://localhost:2947/api/links");
    req.headers.set("authorization", "Bearer correct-key");

    expect(requireApiKeyAuth(req)).toBeNull();
  });

  test("rejects tokens that differ in content despite same length", () => {
    process.env.API_KEY = "correct-key";

    const req = makeRequest("http://localhost:2947/api/links");
    req.headers.set("authorization", "Bearer incorrect-");

    expect(requireApiKeyAuth(req)?.status).toBe(401);
  });

  test("rate limits requests beyond the configured window", () => {
    process.env.API_KEY = "correct-key";
    process.env.API_KEY_RATE_LIMIT_MAX_REQUESTS = "2";

    const req = makeRequest("http://localhost:2947/api/links");
    req.headers.set("authorization", "Bearer correct-key");

    expect(requireApiKeyAuth(req)).toBeNull();
    expect(requireApiKeyAuth(req)).toBeNull();
    expect(requireApiKeyAuth(req)?.status).toBe(429);
  });
});
