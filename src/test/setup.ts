import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

const storageData = new Map<string, unknown>();

vi.mock("@plasmohq/storage", () => {
  class Storage {
    async get<T>(key: string): Promise<T | undefined> {
      return storageData.get(key) as T | undefined;
    }

    async set(key: string, value: unknown): Promise<void> {
      storageData.set(key, value);
    }

    async remove(key: string): Promise<void> {
      storageData.delete(key);
    }
  }

  return { Storage };
});

beforeEach(() => {
  storageData.clear();
});

(globalThis as { chrome?: unknown }).chrome = {
  runtime: {
    getURL: (path: string) =>
      `chrome-extension://test/${path.replace(/^\//, "")}`,
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
};

(globalThis as { __testStorage?: Map<string, unknown> }).__testStorage =
  storageData;
