import { describe, expect, it, vi, afterEach } from "vitest";
import { getDailyUsage, getRemainingMinutes, getSettings } from "../storage";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../types";

const getStorageMap = () =>
  (globalThis as { __testStorage?: Map<string, unknown> }).__testStorage as Map<
    string,
    unknown
  >;

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
    expect(settings.globalExcludePatterns).toEqual(
      DEFAULT_SETTINGS.globalExcludePatterns,
    );
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
      startTime: 0,
      durationMinutes: 10,
      remainingSeconds: 5 * 60,
      isActive: true,
      siteId: "x",
    });

    const remaining = await getRemainingMinutes("x");

    expect(remaining).toBe(15);
  });
});
