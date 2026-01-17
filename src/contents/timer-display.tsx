import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { formatTime } from "~lib/timer";
import { getSettings } from "~lib/storage";
import { isSession } from "~lib/types";
import type { Session } from "~lib/types";
import { matchSiteRule } from "~lib/url-matcher";

import styleText from "data-text:~styles/global.css";

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
};

const storage = new Storage();

const TimerDisplay = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [show, setShow] = useState(false);
  const [isTarget, setIsTarget] = useState(false);

  const loadSession = async () => {
    const currentSession = await storage.get<Session>("currentSession");
    setSession(currentSession);
  };

  const loadTarget = async () => {
    const settings = await getSettings();
    const matched = matchSiteRule(
      window.location.href,
      settings.siteRules,
      settings.globalExcludePatterns,
    );
    setIsTarget(!!matched);
  };

  useEffect(() => {
    // 初期セッション状態を取得
    loadTarget().then(loadSession);

    // ストレージの変更を監視
    storage.watch({
      currentSession: (change) => {
        setSession(isSession(change.newValue) ? change.newValue : null);
      },
    });

    // タブの可視性が変更された時（タブを切り替えて戻った時など）に状態を再読み込み
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // タブが表示された時にセッション状態を再確認
        loadTarget().then(loadSession);
      }
    };

    // History APIの変更を監視（SPAナビゲーション）
    const handlePopState = () => {
      loadTarget().then(loadSession);
    };

    // URL変更を監視するためにMutationObserverを使用（SPAの場合）
    const observer = new MutationObserver(() => {
      // 少し遅延させて、URL変更が完了してから状態を確認
      setTimeout(() => {
        loadTarget().then(loadSession);
      }, 100);
    });

    // 定期的にセッション状態をチェック（フォールバック）
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        loadTarget().then(loadSession);
      }
    }, 2000); // 2秒ごとにチェック

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("popstate", handlePopState);

    // body要素の変更を監視（SPAのナビゲーション検知用）
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("popstate", handlePopState);
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setShow(!!session && session.isActive && isTarget);
  }, [session, isTarget]);

  if (!show || !session) {
    return null;
  }

  const progress = (session.remainingSeconds / (session.durationMinutes * 60)) * 100;
  const timeText = formatTime(session.remainingSeconds);

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999999] flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* 残り時間テキスト */}
      <div
        className="text-xs font-medium"
        style={{
          color: "rgb(139, 92, 246)",
        }}
      >
        {timeText}
      </div>

      {/* 直線プログレスバー */}
      <div
        className="w-20 h-1 rounded-full overflow-hidden"
        style={{
          backgroundColor: "rgba(139, 92, 246, 0.12)",
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, rgb(139, 92, 246) 0%, rgb(6, 182, 212) 100%)",
          }}
        />
      </div>
    </div>
  );
};

export default TimerDisplay;
