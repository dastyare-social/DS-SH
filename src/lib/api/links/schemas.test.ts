import { describe, expect, test } from "bun:test";
import {
  CreateLinkBody,
  ErrorResponse,
  LinkListResponse,
  LinkPathParam,
  LinkResponse,
  SuccessResponse,
  UpdateLinkBody,
} from "./schemas";

describe("CreateLinkBody", () => {
  test("accepts a valid r_to with optional r_path", () => {
    const parsed = CreateLinkBody.parse({
      r_to: "https://example.com/summer-2026",
      r_path: "summer-2026",
    });
    expect(parsed.r_to).toBe("https://example.com/summer-2026");
    expect(parsed.r_path).toBe("summer-2026");
  });

  test("r_path is optional", () => {
    const parsed = CreateLinkBody.parse({ r_to: "https://example.com" });
    expect(parsed.r_path).toBeUndefined();
  });

  test("rejects an invalid r_to", () => {
    expect(() => CreateLinkBody.parse({ r_to: "not-a-url" })).toThrow();
  });

  test("rejects r_path that is too short", () => {
    expect(() =>
      CreateLinkBody.parse({ r_to: "https://example.com", r_path: "a" }),
    ).toThrow();
  });

  test("rejects r_path with invalid characters", () => {
    expect(() =>
      CreateLinkBody.parse({ r_to: "https://example.com", r_path: "UPPER_" }),
    ).toThrow();
  });
});

describe("UpdateLinkBody", () => {
  test("accepts r_to and/or is_active", () => {
    const parsed = UpdateLinkBody.parse({ is_active: false });
    expect(parsed.is_active).toBe(false);
    expect(parsed.r_to).toBeUndefined();
  });

  test("rejects an invalid r_to", () => {
    expect(() => UpdateLinkBody.parse({ r_to: "nope" })).toThrow();
  });
});

describe("LinkPathParam", () => {
  test("accepts an id or slug", () => {
    const parsed = LinkPathParam.parse({ link: "summer-2026" });
    expect(parsed.link).toBe("summer-2026");
  });
});

describe("response schemas", () => {
  const exampleLink = {
    id: "a1b2c3d4e5f6g7h8",
    r_path: "summer-2026",
    r_to: "https://example.com/summer-2026",
    is_active: true,
    redirects: "236",
    createdAt: "2026-06-01T10:30:00.000Z",
    updatedAt: "2026-07-15T14:20:00.000Z",
  };

  test("LinkResponse accepts a valid link", () => {
    const parsed = LinkResponse.parse(exampleLink);
    expect(parsed.id).toBe(exampleLink.id);
  });

  test("LinkListResponse accepts an array of links", () => {
    const parsed = LinkListResponse.parse([exampleLink]);
    expect(parsed).toHaveLength(1);
  });

  test("SuccessResponse accepts a boolean success flag", () => {
    const parsed = SuccessResponse.parse({ success: true });
    expect(parsed.success).toBe(true);
  });

  test("ErrorResponse requires an error string", () => {
    expect(() => ErrorResponse.parse({})).toThrow();
  });
});
