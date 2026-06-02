import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createSession,
  formatTime,
  getElapsedMinutes,
  getRemainingSeconds,
  isSessionExpired,
  isSessionToday,
  pauseSession,
  resumeSession,
  updateSessionRemainingTime,
} from "../timer";

describe("timer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a new session with expected defaults", () => {
    vi.useFakeTimers();
    const now = new Date(2026, 0, 15, 10, 0, 0);
    vi.setSystemTime(now);

    const session = createSession(5, "x", "https://x.com/home");

    expect(session.id).toBe(`session_${now.getTime()}`);
    expect(session.startTime).toBe(now.getTime());
    expect(session.durationMinutes).toBe(5);
    expect(session.remainingSeconds).toBe(300);
    expect(session.isActive).toBe(true);
    expect(session.siteId).toBe("x");
    expect(session.siteUrl).toBe("https://x.com/home");
  });

  it("updates remaining seconds from wall-clock elapsed time", () => {
    const start = new Date(2026, 0, 15, 10, 0, 0).getTime();
    const session = {
      id: "s",
      startTime: start,
      durationMinutes: 1,
      remainingSeconds: 60,
      isActive: true,
      siteId: "x",
    };

    expect(getRemainingSeconds(session, start + 15_000)).toBe(45);
    expect(updateSessionRemainingTime(session, start + 75_000).remainingSeconds).toBe(0);
  });

  it("does not decrease remaining seconds while paused", () => {
    const start = new Date(2026, 0, 15, 10, 0, 0).getTime();
    const pausedSession = {
      id: "s",
      startTime: start,
      durationMinutes: 1,
      remainingSeconds: 45,
      isActive: false,
      siteId: "x",
    };

    expect(getRemainingSeconds(pausedSession, start + 30_000)).toBe(45);
    expect(updateSessionRemainingTime(pausedSession, start + 30_000).remainingSeconds).toBe(45);
  });

  it("stores current remaining seconds when pausing", () => {
    vi.useFakeTimers();
    const start = new Date(2026, 0, 15, 10, 0, 0).getTime();
    vi.setSystemTime(start + 15_000);

    const pausedSession = pauseSession({
      id: "s",
      startTime: start,
      durationMinutes: 1,
      remainingSeconds: 60,
      isActive: true,
      siteId: "x",
    });

    expect(pausedSession.isActive).toBe(false);
    expect(pausedSession.remainingSeconds).toBe(45);
  });

  it("resumes from the stored remaining seconds", () => {
    vi.useFakeTimers();
    const now = new Date(2026, 0, 15, 10, 0, 30).getTime();
    vi.setSystemTime(now);

    const resumedSession = resumeSession({
      id: "s",
      startTime: now - 30_000,
      durationMinutes: 1,
      remainingSeconds: 45,
      isActive: false,
      siteId: "x",
    });

    expect(resumedSession.isActive).toBe(true);
    expect(resumedSession.startTime).toBe(now - 15_000);
    expect(getRemainingSeconds(resumedSession, now + 10_000)).toBe(35);
  });

  it("computes elapsed minutes from wall-clock time with duration bounds", () => {
    vi.useFakeTimers();
    const start = new Date(2026, 0, 15, 10, 0, 0).getTime();
    vi.setSystemTime(start + 75_000);

    expect(
      getElapsedMinutes({
        id: "s",
        startTime: start,
        durationMinutes: 1,
        remainingSeconds: 60,
        isActive: true,
        siteId: "x",
      }),
    ).toBe(1);
  });

  it("checks session expiration state", () => {
    expect(isSessionExpired({ remainingSeconds: 0 } as any)).toBe(true);
    expect(isSessionExpired({ remainingSeconds: 10 } as any)).toBe(false);
  });

  it("detects whether a session is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));

    const todaySession = {
      startTime: new Date(2026, 0, 15, 8, 0, 0).getTime(),
    } as any;
    const yesterdaySession = {
      startTime: new Date(2026, 0, 14, 23, 0, 0).getTime(),
    } as any;

    expect(isSessionToday(todaySession)).toBe(true);
    expect(isSessionToday(yesterdaySession)).toBe(false);
  });

  it("formats time in MM:SS", () => {
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(5)).toBe("00:05");
  });
});
