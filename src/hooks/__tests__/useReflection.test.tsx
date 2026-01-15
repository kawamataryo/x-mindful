import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useReflection } from "../useReflection";
import { sendToBackground } from "@plasmohq/messaging";

vi.mock("@plasmohq/messaging", () => ({
  sendToBackground: vi.fn(),
}));

const mockSendToBackground = vi.mocked(sendToBackground);

describe("useReflection", () => {
  beforeEach(() => {
    mockSendToBackground.mockReset();
    window.location.href = "https://example.com/start";
  });

  it("shows error when reflection is empty", async () => {
    const { result } = renderHook(() => useReflection());

    await act(async () => {
      await result.current.handleSaveReflection();
    });

    expect(result.current.reflectionError).toBe("振り返り内容を入力してください");
  });

  it("sends trimmed reflection and navigates on success", async () => {
    mockSendToBackground.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useReflection());

    act(() => {
      result.current.setReflection("  ふりかえり  ");
    });

    await act(async () => {
      await result.current.handleSaveReflection();
    });

    expect(mockSendToBackground).toHaveBeenCalledWith({
      name: "save-reflection",
      body: { reflection: "ふりかえり" },
    });
    expect(window.location.href).toContain("options.html");
  });

  it("shows error when background returns failure", async () => {
    mockSendToBackground.mockResolvedValue({ success: false, error: "NG" });
    const { result } = renderHook(() => useReflection());

    act(() => {
      result.current.setReflection("memo");
    });

    await act(async () => {
      await result.current.handleSaveReflection();
    });

    expect(result.current.reflectionError).toBe("NG");
  });
});
