import { Storage } from "@plasmohq/storage";
import { getCurrentSession, saveCurrentSession, initializeStorage, getSettings } from "~lib/storage";
import { decrementSession, isSessionExpired, isSessionToday } from "~lib/timer";
import { matchSiteRule } from "~lib/url-matcher";
import { getToday } from "~lib/types";

// タイマーインターバルID
let timerInterval: NodeJS.Timeout | null = null;

// ストレージインスタンス
const storage = new Storage();

/**
 * ローカルTZの「次の0:00」までの残りミリ秒を計算
 */
function getMillisecondsUntilMidnightLocal(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}

/**
 * タイマーを開始
 */
function startTimer() {
  if (timerInterval) {
    return; // 既にタイマーが動作中
  }

  timerInterval = setInterval(async () => {
    try {
      const session = await getCurrentSession();

      if (!session || !session.isActive) {
        stopTimer();
        return;
      }

      // セッションが今日のものでない場合はリセット
      if (!isSessionToday(session)) {
        await saveCurrentSession(null);
        stopTimer();
        return;
      }

      // 残り時間をデクリメント
      const updatedSession = decrementSession(session);

      // セッションが終了したかチェック
      if (isSessionExpired(updatedSession)) {
        const finalSession = {
          ...updatedSession,
          remainingSeconds: 0,
          isActive: false,
        };
        await saveCurrentSession(finalSession);
        stopTimer();

        // 対象サイトのタブを振り返り画面に遷移
        await redirectTabsToReflection(updatedSession.siteId);
      } else {
        await saveCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error("Timer error:", error);
    }
  }, 1000);
}

/**
 * タイマーを停止
 */
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * 対象サイトのタブを振り返り画面にリダイレクト
 */
async function redirectTabsToReflection(siteId: string) {
  try {
    const tabs = await chrome.tabs.query({});
    const reflectionUrl = chrome.runtime.getURL("options.html?view=reflection");
    const settings = await getSettings();

    for (const tab of tabs) {
      if (tab.id && tab.url) {
        const matchedRule = matchSiteRule(
          tab.url,
          settings.siteRules,
          settings.globalExcludePatterns,
        );
        if (matchedRule?.id === siteId) {
          await chrome.tabs.update(tab.id, { url: reflectionUrl });
        }
      }
    }
  } catch (error) {
    console.error("Error redirecting tabs:", error);
  }
}

function buildStartSessionUrl(siteId: string, returnUrl?: string): string {
  const params = new URLSearchParams();
  params.set("view", "start-session");
  params.set("siteId", siteId);
  if (returnUrl) {
    params.set("returnUrl", returnUrl);
  }
  return chrome.runtime.getURL(`options.html?${params.toString()}`);
}

/**
 * タブのURLが変更されたときの処理
 */
async function handleTabUpdate(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
) {
  // URLが変更されたか、ページ読み込みが完了した時にチェック
  if (changeInfo.url || changeInfo.status === "complete") {
    const currentUrl = changeInfo.url || tab.url;

    if (!currentUrl) {
      return;
    }

    console.log("[Site Blocker] Tab update detected:", currentUrl);
    const settings = await getSettings();
    const matchedRule = matchSiteRule(
      currentUrl,
      settings.siteRules,
      settings.globalExcludePatterns,
    );
    console.log("[Site Blocker] Matched rule:", matchedRule?.id || "none");

    // 対象サイトへのアクセスを検出
    if (matchedRule) {
      const session = await getCurrentSession();
      console.log("[Site Blocker] Current session:", session);

      // アクティブなセッションがない場合、タブをoptionsページのセッション開始画面に遷移
      if (
        !session ||
        !session.isActive ||
        session.remainingSeconds <= 0 ||
        session.siteId !== matchedRule.id
      ) {
        console.log("[Site Blocker] No active session, redirecting to start-session");
        await chrome.tabs.update(tabId, {
          url: buildStartSessionUrl(matchedRule.id, currentUrl),
        });
        return;
      }

      // アクティブなセッションがある場合はタイマーを開始
      console.log("[Site Blocker] Active session found, starting timer");
      startTimer();
    }
  }
}

/**
 * ブラウザ起動時の状態復元
 */
async function restoreState() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return;
    }

    // セッションが今日のものでない場合はクリア
    if (!isSessionToday(session)) {
      await saveCurrentSession(null);
      return;
    }

    // 経過時間を計算して残り時間を更新
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - session.startTime) / 1000);
    const totalSeconds = session.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    const updatedSession = {
      ...session,
      remainingSeconds,
      isActive: remainingSeconds > 0 && session.isActive,
    };

    await saveCurrentSession(updatedSession);

    if (updatedSession.isActive && updatedSession.remainingSeconds > 0) {
      startTimer();
    }
  } catch (error) {
    console.error("Error restoring state:", error);
  }
}

/**
 * 日本時間の0:00でリセット処理を実行
 */
async function resetAtMidnightLocal() {
  console.log("[Site Blocker] Resetting at midnight (local TZ)");

  // セッションをリセット
  const session = await getCurrentSession();
  if (session) {
    await saveCurrentSession(null);
    stopTimer();

    // 対象サイトのタブをセッション開始画面にリダイレクト
    const tabs = await chrome.tabs.query({});
    const settings = await getSettings();

    for (const tab of tabs) {
      if (tab.id && tab.url) {
        const matchedRule = matchSiteRule(
          tab.url,
          settings.siteRules,
          settings.globalExcludePatterns,
        );
        if (matchedRule) {
          await chrome.tabs.update(tab.id, {
            url: buildStartSessionUrl(matchedRule.id, tab.url),
          });
        }
      }
    }
  }

  // 次の0:00までのタイマーを再設定
  scheduleMidnightReset();
}

/**
 * 日本時間の0:00にリセット処理をスケジュール
 */
let midnightResetTimeout: NodeJS.Timeout | null = null;

function scheduleMidnightReset() {
  const msUntilMidnight = getMillisecondsUntilMidnightLocal();
  console.log(
    `[Site Blocker] Scheduling reset in ${Math.floor(msUntilMidnight / 1000 / 60)} minutes`,
  );

  if (midnightResetTimeout) {
    clearTimeout(midnightResetTimeout);
    midnightResetTimeout = null;
  }

  midnightResetTimeout = setTimeout(() => {
    resetAtMidnightLocal();
  }, msUntilMidnight);
}

/**
 * 日付変更チェック（1分ごと）- フォールバック用
 */
let lastCheckDate = getToday();

setInterval(async () => {
  const currentDate = getToday();

  if (currentDate !== lastCheckDate) {
    lastCheckDate = currentDate;
    console.log("[Site Blocker] Date changed (fallback check)");

    // 日付が変わったらセッションをリセット
    const session = await getCurrentSession();
    if (session) {
      await saveCurrentSession(null);
      stopTimer();

      // 対象サイトのタブをセッション開始画面にリダイレクト
      const tabs = await chrome.tabs.query({});
      const settings = await getSettings();

      for (const tab of tabs) {
        if (tab.id && tab.url) {
          const matchedRule = matchSiteRule(
            tab.url,
            settings.siteRules,
            settings.globalExcludePatterns,
          );
          if (matchedRule) {
            await chrome.tabs.update(tab.id, {
              url: buildStartSessionUrl(matchedRule.id, tab.url),
            });
          }
        }
      }
    }

    // 次の0:00までのタイマーを再設定
    scheduleMidnightReset();
  }
}, 60000); // 1分ごとにチェック

// イベントリスナーの登録
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension startup");
  initializeStorage();
  restoreState();
  scheduleMidnightReset();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  initializeStorage();
  scheduleMidnightReset();
});

chrome.tabs.onUpdated.addListener(handleTabUpdate);

// タブが作成された時もチェック
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id && tab.url) {
    console.log("[Site Blocker] Tab created:", tab.url);
    const settings = await getSettings();
    const matchedRule = matchSiteRule(
      tab.url,
      settings.siteRules,
      settings.globalExcludePatterns,
    );

    if (matchedRule) {
      const session = await getCurrentSession();

      if (!session || !session.isActive || session.remainingSeconds <= 0) {
        console.log("[Site Blocker] Redirecting new tab to start-session");
        await chrome.tabs.update(tab.id, {
          url: buildStartSessionUrl(matchedRule.id, tab.url),
        });
      }
    }
  }
});

// ストレージの変更を監視してタイマーを開始/停止
storage.watch({
  currentSession: (change) => {
    const session = change.newValue;

    if (session && session.isActive && session.remainingSeconds > 0) {
      startTimer();
    } else {
      stopTimer();
    }
  },
});

console.log("Site Blocker background script loaded");
