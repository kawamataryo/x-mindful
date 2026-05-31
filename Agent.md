# Agent Guide

## Tool Overview

Mindful Sites is a Plasmo-based Chrome extension that makes configured sites usable only through intentional timed sessions. The default rule targets X/Twitter, but the settings screen supports multiple site rules with regular-expression based include patterns, global exclude patterns, per-site daily limits, and representative site URLs.

The core user flow is:

1. A user opens a configured target URL.
2. The background script redirects the tab to `options.html?view=start-session&siteId=...&returnUrl=...` unless an active session exists for that site.
3. The user starts a preset or custom-length session.
4. The tab returns to the target URL and a content-script overlay shows the remaining time.
5. When time expires, matching target tabs are redirected to `options.html?view=reflection`.
6. Saving a non-empty reflection records the session in local extension storage and clears the current session.

All app data is stored locally through `@plasmohq/storage`; the current code does not send usage data to an external server.

## Stack

- Package manager: `pnpm`
- Extension framework: Plasmo
- UI: React 19, Tailwind CSS
- Messaging/storage: `@plasmohq/messaging`, `@plasmohq/storage`
- Charts: Chart.js through `react-chartjs-2`
- Tests: Vitest with Happy DOM and Testing Library
- Lint/format: Oxc tools (`oxlint`, `oxfmt`)
- Type checking: `tsc --noEmit`

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm package
pnpm lint
pnpm format
pnpm format:check
pnpm fix
pnpm test
pnpm test:e2e
pnpm typecheck
```

For normal code changes, run at least:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

Load the development extension from `build/chrome-mv3-dev` after `pnpm dev`. Production builds are written under `build/chrome-mv3-prod`.

## Important Files

- `package.json`: scripts, dependencies, and Chrome manifest permissions.
- `src/background/index.ts`: tab monitoring, redirects, countdown timer, startup restore, and local-midnight reset.
- `src/background/messages/start-session.ts`: validates and creates a new session.
- `src/background/messages/end-session.ts`: manually ends an active session and records elapsed usage without reflection.
- `src/background/messages/save-reflection.ts`: saves the required reflection after an expired session and clears the current session.
- `src/contents/timer-display.tsx`: content-script timer overlay shown on matching target pages.
- `src/options.tsx`: dashboard, session-start, and reflection views selected by URL query.
- `src/popup.tsx`: compact extension popup with today's remaining usage and navigation.
- `src/tabs/settings.tsx`: settings page.
- `src/hooks/useSessionStart.ts`: start-session UI state, return URL handling, and background messaging.
- `src/hooks/useSettings.ts`: settings form state, regex validation, and persistence.
- `src/hooks/useDashboard.ts`: usage aggregation for dashboard and popup.
- `src/lib/types.ts`: storage shapes, default settings, storage keys, and local-date helpers.
- `src/lib/storage.ts`: storage access, legacy migration, daily usage indexing, remaining-time calculation.
- `src/lib/timer.ts`: pure session/timer helpers.
- `src/lib/url-matcher.ts`: regex compilation, validation, include/exclude matching.
- `src/test/setup.ts`: test mocks for Plasmo storage and Chrome APIs.

## Data Model

Storage keys are defined in `src/lib/types.ts`.

- `settings`: `{ presetMinutes, siteRules, globalExcludePatterns }`
- `currentSession`: `{ id, startTime, durationMinutes, remainingSeconds, isActive, siteId, siteUrl? }`
- `dailyUsage:<YYYY-MM-DD>`: daily record keyed by local date, containing per-site totals and session records.
- `dailyUsageIndex`: list of dates used by history/dashboard queries.

`src/lib/storage.ts` still reads and migrates older storage shapes. Preserve those normalization paths unless intentionally dropping backwards compatibility.

## Behavioral Notes

- URL matching first applies `globalExcludePatterns`; excluded URLs are never treated as target pages.
- Include and exclude patterns are regex strings. `src/lib/url-matcher.ts` also accepts slash-form regex strings such as `/pattern/i`.
- Only one `currentSession` exists globally. A session is tied to a `siteId`, so opening a different configured site while a session for another site is active redirects to the start-session view.
- Countdown is owned by the background script and continues once started, even if the user leaves the target page, until the session becomes inactive or is cleared.
- On browser startup, `restoreState()` recalculates remaining time from `startTime`, rather than trusting a stale countdown.
- At local midnight, the current session is cleared and target tabs are redirected to the start-session screen. A one-minute date-change interval exists as a fallback.
- Daily limit checks include elapsed time from the active session for the same site.
- `end-session` records elapsed usage with an empty reflection only when the session is still active. Expired sessions should go through `save-reflection`.
- `save-reflection` requires non-empty trimmed text.

## Implementation Guidance

- Use the `~` alias for imports from `src`.
- Keep timer/session math in `src/lib/timer.ts` when possible so it remains easy to test.
- Keep URL-rule behavior in `src/lib/url-matcher.ts`; do not duplicate regex matching in UI components.
- Keep storage migrations in `src/lib/storage.ts`, close to the normalization functions.
- When changing settings shape or session shape, update `src/lib/types.ts`, storage normalization, UI form handling, and tests together.
- When changing user-facing session behavior, check background handlers, `useSessionStart`, `ReflectionView`, and content overlay interactions as one flow.
- Be careful with local-date logic. The helpers currently use the runtime local timezone and comments assume local-day semantics.
- Do not remove `storage.watch({ currentSession })` in the background script; it is what starts/stops the countdown when messages update storage.

## Testing Focus

Existing tests cover storage normalization/remaining minutes, timer helpers, URL matching, dashboard aggregation, and reflection hook behavior. Add or update tests when changing:

- daily usage persistence or migration;
- remaining-time and daily-limit calculation;
- regex validation or matching semantics;
- session creation, expiration, or reflection saving;
- dashboard/session-history aggregation.

Manual Chrome-extension QA is still useful for redirect loops, content-script overlay rendering, and Plasmo build output because those depend on real extension APIs.
