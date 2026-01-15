import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDashboard } from "../useDashboard";
import type { DailyUsage, SiteRule } from "~lib/types";
import {
  getAllDailyUsage,
  getDailyUsage,
  getRemainingMinutes,
} from "~lib/storage";

vi.mock("~lib/storage", () => ({
  getAllDailyUsage: vi.fn(),
  getDailyUsage: vi.fn(),
  getRemainingMinutes: vi.fn(),
}));

const mockGetAllDailyUsage = vi.mocked(getAllDailyUsage);
const mockGetDailyUsage = vi.mocked(getDailyUsage);
const mockGetRemainingMinutes = vi.mocked(getRemainingMinutes);

describe("useDashboard", () => {
  it("builds site stats and session history", async () => {
    const siteRules: SiteRule[] = [
      {
        id: "x",
        label: "X",
        includePatterns: [],
        dailyLimitMinutes: 30,
        siteUrl: "https://x.com/home",
      },
    ];

    const dailyUsage: DailyUsage = {
      date: "2026-01-15",
      siteUsage: {
        x: {
          siteId: "x",
          totalUsedMinutes: 5,
          sessions: [
            {
              id: "s1",
              startTime: 200,
              endTime: 260,
              durationMinutes: 1,
              reflection: "",
              siteId: "x",
              siteUrl: "https://x.com/home",
            },
            {
              id: "s2",
              startTime: 100,
              endTime: 160,
              durationMinutes: 1,
              reflection: "",
              siteId: "x",
              siteUrl: "https://x.com/home",
            },
          ],
        },
      },
    };

    mockGetDailyUsage.mockResolvedValue(dailyUsage);
    mockGetAllDailyUsage.mockResolvedValue([dailyUsage]);
    mockGetRemainingMinutes.mockResolvedValue(25);

    const { result } = renderHook(() => useDashboard(siteRules));

    await act(async () => {
      await result.current.loadDashboardData();
    });

    expect(result.current.dashboardLoading).toBe(false);
    expect(result.current.siteStats).toEqual([
      {
        siteId: "x",
        label: "X",
        dailyLimitMinutes: 30,
        remainingMinutes: 25,
        usedMinutes: 5,
        sessionCount: 2,
        siteUrl: "https://x.com/home",
      },
    ]);
    expect(result.current.allSessions[0]?.id).toBe("s1");
    expect(result.current.allSessions[0]?.date).toBe("2026-01-15");
    expect(result.current.allSessions[0]?.siteLabel).toBe("X");
    expect(result.current.dailyUsageHistory).toEqual([dailyUsage]);
    expect(mockGetAllDailyUsage).toHaveBeenCalledTimes(2);
  });
});
