import { describe, expect, it, vi, afterEach } from "vitest";
import handler from "../messages/start-session";
import type { StartSessionResponse } from "../messages/start-session";
import { DEFAULT_SETTINGS, STORAGE_KEYS, type Session } from "~lib/types";

const getStorageMap = () =>
  (globalThis as { __testStorage?: Map<string, unknown> }).__testStorage as Map<string, unknown>;

async function sendStartSession(body: {
  durationMinutes: number;
  siteId: string;
  siteUrl?: string;
}) {
  const send = vi.fn<(response: StartSessionResponse) => void>();

  await handler(
    { body } as Parameters<typeof handler>[0],
    { send } as Parameters<typeof handler>[1],
  );

  return send.mock.calls[0]?.[0];
}

describe("start-session message", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects a currently active session with remaining time", async () => {
    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.CURRENT_SESSION, {
      id: "existing",
      startTime: Date.now(),
      durationMinutes: 10,
      remainingSeconds: 60,
      isActive: true,
      siteId: "x",
    } satisfies Session);

    const response = await sendStartSession({
      durationMinutes: 1,
      siteId: "x",
      siteUrl: "https://x.com/home",
    });

    expect(response).toEqual({
      success: false,
      error: "既に進行中のセッションが存在します",
    });
  });

  it("rejects a paused session with remaining time", async () => {
    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.CURRENT_SESSION, {
      id: "existing",
      startTime: Date.now() - 30_000,
      durationMinutes: 10,
      remainingSeconds: 570,
      isActive: false,
      siteId: "x",
    } satisfies Session);

    const response = await sendStartSession({
      durationMinutes: 1,
      siteId: "x",
      siteUrl: "https://x.com/home",
    });

    expect(response).toEqual({
      success: false,
      error: "既に進行中のセッションが存在します",
    });
  });

  it("allows a new session when a stale active session has no remaining time", async () => {
    vi.useFakeTimers();
    const now = new Date(2026, 0, 15, 10, 0, 0);
    vi.setSystemTime(now);

    const storageMap = getStorageMap();
    storageMap.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    storageMap.set(STORAGE_KEYS.CURRENT_SESSION, {
      id: "expired",
      startTime: now.getTime() - 60_000,
      durationMinutes: 1,
      remainingSeconds: 0,
      isActive: true,
      siteId: "x",
    } satisfies Session);

    const response = await sendStartSession({
      durationMinutes: 1,
      siteId: "x",
      siteUrl: "https://x.com/home",
    });

    const savedSession = storageMap.get(STORAGE_KEYS.CURRENT_SESSION) as Session;
    expect(response.success).toBe(true);
    expect(response.session?.id).toBe(`session_${now.getTime()}`);
    expect(savedSession.id).toBe(`session_${now.getTime()}`);
    expect(savedSession.remainingSeconds).toBe(60);
  });
});
