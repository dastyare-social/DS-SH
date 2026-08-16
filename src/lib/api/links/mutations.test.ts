import { describe, expect, test } from "bun:test";
import { createLink, updateLink } from "./mutations";

describe("createLink (validation only)", () => {
  test("rejects an invalid destination URL", async () => {
    const result = await createLink({ r_to: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("valid URL");
    }
  });

  test("rejects an invalid custom r_path", async () => {
    const result = await createLink({
      r_to: "https://example.com",
      r_path: "UPPERCASE_INVALID",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("characters");
    }
  });
});

describe("updateLink (validation only)", () => {
  test("rejects an invalid destination URL", async () => {
    const result = await updateLink("some-id", { r_to: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("valid URL");
    }
  });

  test("rejects an empty patch", async () => {
    const result = await updateLink("some-id", {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("at least one field");
    }
  });
});
