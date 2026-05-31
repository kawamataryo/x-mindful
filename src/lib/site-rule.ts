import type { Settings, SiteRule } from "./types";

export type AddSiteRuleResult =
  | { status: "added"; rule: SiteRule }
  | { status: "exists"; rule: SiteRule }
  | { status: "unsupported" };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSupportedOrigin(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function buildOriginPattern(origin: string): string {
  return `^${escapeRegExp(origin)}(/|$)`;
}

function toSiteLabel(origin: string, title?: string): string {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  return new URL(origin).hostname.replace(/^www\./, "");
}

function toSiteId(origin: string, existingRules: SiteRule[]): string {
  const url = new URL(origin);
  const baseId = url.hostname
    .replace(/^www\./, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const fallbackId = baseId || "site";
  const existingIds = new Set(existingRules.map((rule) => rule.id));

  if (!existingIds.has(fallbackId)) {
    return fallbackId;
  }

  let index = 2;
  while (existingIds.has(`${fallbackId}_${index}`)) {
    index += 1;
  }

  return `${fallbackId}_${index}`;
}

export function findSiteRuleByOrigin(settings: Settings, origin: string): SiteRule | null {
  return (
    settings.siteRules.find(
      (rule) =>
        (rule.siteUrl ? getSupportedOrigin(rule.siteUrl) === origin : false) ||
        rule.includePatterns.some((pattern) => pattern === buildOriginPattern(origin)),
    ) || null
  );
}

export function buildSiteRuleFromUrl(
  settings: Settings,
  rawUrl: string,
  title?: string,
): AddSiteRuleResult {
  const origin = getSupportedOrigin(rawUrl);
  if (!origin) {
    return { status: "unsupported" };
  }

  const existingRule = findSiteRuleByOrigin(settings, origin);
  if (existingRule) {
    return { status: "exists", rule: existingRule };
  }

  return {
    status: "added",
    rule: {
      id: toSiteId(origin, settings.siteRules),
      label: toSiteLabel(origin, title),
      includePatterns: [buildOriginPattern(origin)],
      dailyLimitMinutes: 30,
      siteUrl: origin,
    },
  };
}
