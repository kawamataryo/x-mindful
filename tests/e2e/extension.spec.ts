import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import http from "node:http";
import path from "node:path";

const repoRoot = process.cwd();
const extensionPath = path.join(repoRoot, "build/chrome-mv3-prod");

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type TestServer = {
  origin: string;
  close: () => Promise<void>;
};

async function startTestServer(): Promise<TestServer> {
  const server = http.createServer((_, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`
      <!doctype html>
      <html>
        <head><title>Local Test Site</title></head>
        <body>
          <main>
            <h1>Local Test Site</h1>
            <p>This page is used by the extension E2E suite.</p>
          </main>
        </body>
      </html>
    `);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to start test server");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function launchExtension() {
  const userDataDir = path.join(repoRoot, ".tmp", `x-mindful-e2e-${Date.now()}`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  const extensionId = serviceWorker.url().split("/")[2];
  return { context, extensionId };
}

async function seedSettings(page: Page, extensionId: string, siteOrigin: string) {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.evaluate(
    async ({ origin, includePattern }) => {
      const settings = {
        presetMinutes: [1, 5, 10],
        globalExcludePatterns: [],
        siteRules: [
          {
            id: "local",
            label: "Local Test",
            includePatterns: [includePattern],
            dailyLimitMinutes: 30,
            siteUrl: `${origin}/home`,
          },
        ],
      };

      await chrome.storage.sync.clear();
      await chrome.storage.sync.set({ settings: JSON.stringify(settings) });

      // `onInstalled` initializes defaults asynchronously on a fresh profile.
      // Write once more after that startup window so tests do not race it.
      await new Promise((resolve) => setTimeout(resolve, 200));
      await chrome.storage.sync.set({
        settings: JSON.stringify(settings),
      });
    },
    { origin: siteOrigin, includePattern: `^${escapeRegex(siteOrigin)}` },
  );
}

test.describe("Mindful Sites extension", () => {
  let context: BrowserContext;
  let extensionId: string;
  let server: TestServer;

  test.beforeEach(async () => {
    server = await startTestServer();
    const launched = await launchExtension();
    context = launched.context;
    extensionId = launched.extensionId;

    const page = await context.newPage();
    await seedSettings(page, extensionId, server.origin);
    await page.close();
  });

  test.afterEach(async () => {
    await context?.close();
    await server?.close();
  });

  test("popup shows configured site and remaining time", async () => {
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(popup.getByRole("heading", { name: "Mindful Sites" })).toBeVisible();
    await expect(popup.getByText("Local Test")).toBeVisible();
    await expect(popup.getByText("30m")).toBeVisible();
    await expect(popup.getByRole("button", { name: "Dashboard" })).toBeVisible();
  });

  test("target site redirects to start flow, then starts a timed session", async () => {
    const page = await context.newPage();
    await page.goto(`${server.origin}/home`);

    await expect(page).toHaveURL(/options\.html\?view=start-session/);
    await expect(page.getByRole("heading", { name: "Start session" })).toBeVisible();
    await expect(page.getByText("Local Test")).toBeVisible();
    await expect(page.getByText("30m remaining today")).toBeVisible();

    await page.getByRole("button", { name: "1m" }).click();

    await expect(page).toHaveURL(`${server.origin}/home`);
    await expect(page.getByRole("heading", { name: "Local Test Site" })).toBeVisible();
    await expect(page.getByText(/00:[0-5][0-9]/)).toBeVisible();
  });
});
