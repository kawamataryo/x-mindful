import type { SiteRule } from "./types";

const patternCache = new Map<string, RegExp | null>();

export function compilePattern(pattern: string): RegExp | null {
  if (patternCache.has(pattern)) {
    return patternCache.get(pattern) || null;
  }

  try {
    if (pattern.startsWith("/")) {
      const lastSlash = pattern.lastIndexOf("/");
      if (lastSlash > 1) {
        const body = pattern.slice(1, lastSlash);
        const flags = pattern.slice(lastSlash + 1);
        const regex = new RegExp(body, flags);
        patternCache.set(pattern, regex);
        return regex;
      }
    }

    const regex = new RegExp(pattern);
    patternCache.set(pattern, regex);
    return regex;
  } catch {
    patternCache.set(pattern, null);
    return null;
  }
}

export function findInvalidPatterns(patterns: string[]): string[] {
  return patterns.filter((pattern) => !compilePattern(pattern));
}

export function matchSiteRule(
  url: string,
  siteRules: SiteRule[],
  globalExcludePatterns: string[],
): SiteRule | null {
  if (globalExcludePatterns.some((pattern) => compilePattern(pattern)?.test(url))) {
    return null;
  }

  for (const rule of siteRules) {
    if (rule.includePatterns.some((pattern) => compilePattern(pattern)?.test(url))) {
      return rule;
    }
  }

  return null;
}

export function isTimerTargetPage(
  url: string,
  siteRules: SiteRule[],
  globalExcludePatterns: string[],
): boolean {
  return !!matchSiteRule(url, siteRules, globalExcludePatterns);
}
