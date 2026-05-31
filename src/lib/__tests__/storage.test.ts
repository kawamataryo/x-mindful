import { describe, expect, it, vi, afterEach } from "vitest";
import {
  addSessionRecord,
  getAllDailyUsage,
  getDailyUsage,
  getRemainingMinutes,
  getSettings,
  addSiteRuleFromUrl,
} from "../storage";
import { DEFAULT_SETTINGS, STORAGE_KEYS, type DailyUsage } from "../types";

const getStorageMap = () =>
  (globalThis as { __testStorage?: Map<string, unknown> }).__testStorage as Map<string, unknown>;

describe("storage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default settings and persists them when empty", async () => {
    const settings = await getSettings();
    const storageMap = getStorageMap();

    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(storageMap.get(STORAGE_KEYS.SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });

  it("migrates legacy settings into siteRules", async () => {
    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.SETTINGS, {
      presetMinutes: [2, 4],
      dailyLimitMinutes: 15,
    });

    const settings = await getSettings();

    expect(settings.siteRules[0]?.dailyLimitMinutes).toBe(15);
    expect(settings.presetMinutes).toEqual([2, 4]);
    expect(settings.globalExcludePatterns).toEqual(DEFAULT_SETTINGS.globalExcludePatterns);
  });

  it("adds a site rule from a URL and persists it", async () => {
    const result = await addSiteRuleFromUrl("https://example.com/articles/1", "Example News");
    const settings = await getSettings();

    expect(result.status).toBe("added");
    expect(settings.siteRules).toHaveLength(DEFAULT_SETTINGS.siteRules.length + 1);
    expect(settings.siteRules.at(-1)).toEqual({
      id: "example_com",
      label: "Example News",
      includePatterns: ["^https://example\\.com(/|$)"],
      dailyLimitMinutes: 30,
      siteUrl: "https://example.com",
    });
  });

  it("does not persist duplicate site rules for the same origin", async () => {
    await addSiteRuleFromUrl("https://example.com/articles/1", "Example News");
    const result = await addSiteRuleFromUrl("https://example.com/another", "Example Again");
    const settings = await getSettings();

    expect(result.status).toBe("exists");
    expect(
      settings.siteRules.filter((rule) => rule.siteUrl === "https://example.com"),
    ).toHaveLength(1);
  });

  it("normalizes legacy daily usage into siteUsage", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 9, 0, 0));

    const storageMap = getStorageMap();
    const legacyUsage = {
      date: "2026-01-15",
      totalUsedMinutes: 5,
      sessions: [
        {
          id: "s1",
          startTime: 1,
          endTime: 2,
          durationMinutes: 5,
          reflection: "",
        },
      ],
    };
    storageMap.set(STORAGE_KEYS.DAILY_USAGE, {
      "2026-01-15": legacyUsage,
    });

    const usage = await getDailyUsage("2026-01-15");

    expect(usage.siteUsage.x.totalUsedMinutes).toBe(5);
    expect(usage.siteUsage.x.sessions[0]?.siteId).toBe("x");
    expect(storageMap.get(`${STORAGE_KEYS.DAILY_USAGE}:2026-01-15`)).toBeTruthy();
  });

  it("normalizes indexed daily usage and removes missing index entries", async () => {
    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.DAILY_USAGE_INDEX, ["2026-01-15", "2026-01-16"]);
    storageMap.set(`${STORAGE_KEYS.DAILY_USAGE}:2026-01-15`, {
      date: "2026-01-15",
      siteUsage: {
        x: {
          totalUsedMinutes: 3,
          sessions: [
            {
              id: "s1",
              startTime: 1,
              endTime: 2,
              durationMinutes: 3,
              reflection: "",
            },
          ],
        },
      },
    });

    const allUsage = await getAllDailyUsage();
    const normalizedUsage = storageMap.get(`${STORAGE_KEYS.DAILY_USAGE}:2026-01-15`) as DailyUsage;

    expect(allUsage).toHaveLength(1);
    expect(normalizedUsage.siteUsage.x.siteId).toBe("x");
    expect(normalizedUsage.siteUsage.x.sessions[0]?.siteId).toBe("x");
    expect(storageMap.get(STORAGE_KEYS.DAILY_USAGE_INDEX)).toEqual(["2026-01-15"]);
  });

  it("computes remaining minutes including active session time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 10, 0, 0));

    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.SETTINGS, {
      ...DEFAULT_SETTINGS,
      siteRules: [
        {
          ...DEFAULT_SETTINGS.siteRules[0],
          id: "x",
          dailyLimitMinutes: 30,
        },
      ],
    });
    storageMap.set(STORAGE_KEYS.DAILY_USAGE, {
      "2026-01-15": {
        date: "2026-01-15",
        siteUsage: {
          x: {
            siteId: "x",
            totalUsedMinutes: 10,
            sessions: [],
          },
        },
      },
    });
    storageMap.set(STORAGE_KEYS.CURRENT_SESSION, {
      id: "s1",
      startTime: new Date(2026, 0, 15, 9, 55, 0).getTime(),
      durationMinutes: 10,
      remainingSeconds: 10 * 60,
      isActive: true,
      siteId: "x",
    });

    const remaining = await getRemainingMinutes("x");

    expect(remaining).toBe(15);
  });

  it("records session usage on the session start date, not the save date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 16, 0, 5, 0));

    await addSessionRecord({
      id: "s1",
      startTime: new Date(2026, 0, 15, 23, 58, 0).getTime(),
      endTime: new Date(2026, 0, 16, 0, 1, 0).getTime(),
      durationMinutes: 3,
      reflection: "",
      siteId: "x",
    });

    const storageMap = getStorageMap();
    expect(storageMap.get(`${STORAGE_KEYS.DAILY_USAGE}:2026-01-15`)).toBeTruthy();
    expect(storageMap.get(`${STORAGE_KEYS.DAILY_USAGE}:2026-01-16`)).toBeUndefined();
  });
});
