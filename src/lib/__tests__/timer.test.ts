import { describe, expect, it, vi, afterEach } from "vitest";
import {
  createSession,
  decrementSession,
  formatTime,
  isSessionExpired,
  isSessionToday,
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

  it("decrements remaining seconds with a lower bound of 0", () => {
    const session = {
      id: "s",
      startTime: 0,
      durationMinutes: 1,
      remainingSeconds: 1,
      isActive: true,
      siteId: "x",
    };

    expect(decrementSession(session).remainingSeconds).toBe(0);
    expect(decrementSession({ ...session, remainingSeconds: 0 }).remainingSeconds).toBe(0);
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
