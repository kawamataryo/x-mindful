import { describe, expect, it } from "vitest";
import {
  compilePattern,
  findInvalidPatterns,
  isTimerTargetPage,
  matchSiteRule,
} from "../url-matcher";
import type { SiteRule } from "../types";

describe("url-matcher", () => {
  const rules: SiteRule[] = [
    {
      id: "x",
      label: "X",
      includePatterns: ["^https?://(twitter|x)\\.com/"],
      dailyLimitMinutes: 30,
    },
  ];

  it("compiles regex literal patterns with flags", () => {
    const regex = compilePattern("/hello/i");
    expect(regex?.test("HeLLo")).toBe(true);
  });

  it("detects invalid patterns", () => {
    const invalid = findInvalidPatterns(["[", "(abc", "^https://"]);
    expect(invalid).toEqual(["[", "(abc"]);
  });

  it("returns null when excluded by global patterns", () => {
    const result = matchSiteRule("https://x.com/messages", rules, [
      "^https?://(twitter|x)\\.com/messages",
    ]);
    expect(result).toBeNull();
  });

  it("matches a rule when included", () => {
    const result = matchSiteRule("https://x.com/home", rules, []);
    expect(result?.id).toBe("x");
  });

  it("reports timer target availability", () => {
    expect(isTimerTargetPage("https://x.com/home", rules, [])).toBe(true);
    expect(isTimerTargetPage("https://example.com", rules, [])).toBe(false);
  });
});
