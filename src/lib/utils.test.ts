import { describe, expect, test } from "bun:test";
import { capitalize, cn } from "./utils";

describe("capitalize", () => {
  test("capitalizes the first letter", () => {
    expect(capitalize("panel")).toBe("Panel");
  });

  test("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  test("handles already-capitalized strings", () => {
    expect(capitalize("Panel")).toBe("Panel");
  });
});

describe("cn", () => {
  test("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  test("filters falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  test("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
