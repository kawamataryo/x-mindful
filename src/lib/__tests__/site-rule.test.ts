import { describe, expect, it } from "vitest";
import { buildOriginPattern, buildSiteRuleFromUrl, getSupportedOrigin } from "../site-rule";
import { DEFAULT_SETTINGS, type Settings } from "../types";

function settingsWithRules(siteRules: Settings["siteRules"]): Settings {
  return {
    ...DEFAULT_SETTINGS,
    siteRules,
  };
}

describe("site-rule", () => {
  it("extracts only http and https origins", () => {
    expect(getSupportedOrigin("https://example.com/path?q=1")).toBe("https://example.com");
    expect(getSupportedOrigin("http://localhost:3000/a")).toBe("http://localhost:3000");
    expect(getSupportedOrigin("chrome://extensions")).toBeNull();
    expect(getSupportedOrigin("not a url")).toBeNull();
  });

  it("builds an escaped origin pattern", () => {
    expect(buildOriginPattern("https://sub.example.com:8443")).toBe(
      "^https://sub\\.example\\.com:8443(/|$)",
    );
  });

  it("builds a new site rule from the current page URL", () => {
    const result = buildSiteRuleFromUrl(
      settingsWithRules([]),
      "https://news.example.com/articles/1",
      "News Example",
    );

    expect(result.status).toBe("added");
    if (result.status !== "added") throw new Error("expected added result");
    expect(result.rule).toEqual({
      id: "news_example_com",
      label: "News Example",
      includePatterns: ["^https://news\\.example\\.com(/|$)"],
      dailyLimitMinutes: 30,
      siteUrl: "https://news.example.com",
    });
  });

  it("does not duplicate a rule for the same origin", () => {
    const existingRule = {
      id: "example",
      label: "Example",
      includePatterns: ["^https://example\\.com(/|$)"],
      dailyLimitMinutes: 10,
      siteUrl: "https://example.com",
    };

    const result = buildSiteRuleFromUrl(
      settingsWithRules([existingRule]),
      "https://example.com/deep/path",
    );

    expect(result).toEqual({ status: "exists", rule: existingRule });
  });

  it("does not treat origin prefixes as duplicates", () => {
    const result = buildSiteRuleFromUrl(
      settingsWithRules([
        {
          id: "evil",
          label: "Evil",
          includePatterns: ["^https://example\\.com\\.evil(/|$)"],
          dailyLimitMinutes: 10,
          siteUrl: "https://example.com.evil",
        },
      ]),
      "https://example.com/articles",
    );

    expect(result.status).toBe("added");
  });
});
