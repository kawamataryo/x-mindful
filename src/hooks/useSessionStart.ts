import { useCallback, useMemo, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { sendToBackground } from "@plasmohq/messaging";
import { getRemainingMinutes, getSettings } from "~lib/storage";
import type { Session, SiteRule } from "~lib/types";

const storage = new Storage();

export function useSessionStart() {
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [siteRules, setSiteRules] = useState<SiteRule[]>([]);
  const [targetSiteId, setTargetSiteId] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  const targetSiteRule = useMemo(
    () => siteRules.find((rule) => rule.id === targetSiteId) || null,
    [siteRules, targetSiteId],
  );

  const getRedirectUrl = useCallback(
    (sessionSiteId?: string, sessionSiteUrl?: string | null) => {
      if (sessionSiteUrl) return sessionSiteUrl;
      const rule = siteRules.find((item) => item.id === sessionSiteId);
      return rule?.siteUrl || null;
    },
    [siteRules],
  );

  // セッション開始画面用データをロード
  const loadSessionStartData = useCallback(async () => {
    try {
      const currentSettings = await getSettings();
      setPresets(currentSettings.presetMinutes);
      setSiteRules(currentSettings.siteRules);

      const currentSession = await storage.get<Session>("currentSession");
      setActiveSession(currentSession && currentSession.isActive ? currentSession : null);

      const params = new URLSearchParams(window.location.search);
      const siteIdParam = params.get("siteId");
      const returnUrlParam = params.get("returnUrl");
      setReturnUrl(returnUrlParam);

      const initialSiteId = siteIdParam || currentSettings.siteRules[0]?.id || null;
      setTargetSiteId(initialSiteId);

      if (initialSiteId) {
        const remaining = await getRemainingMinutes(initialSiteId);
        setRemainingMinutes(remaining);
      } else {
        setRemainingMinutes(0);
      }
    } catch (error) {
      console.error("Error loading session start data:", error);
      setStartError("データの読み込みに失敗しました");
    }
  }, []);

  // セッション開始画面：プリセット選択
  const handlePresetClick = async (minutes: number) => {
    // 残り時間チェック
    if (minutes > remainingMinutes) {
      setStartError(`本日の残り利用可能時間は${remainingMinutes}分です`);
      return;
    }

    if (!targetSiteId) {
      setStartError("対象サイトを選択してください");
      return;
    }

    // 選択状態を更新
    setSelectedMinutes(minutes);
    setCustomMinutes("");
    setStartError("");

    // 自動でセッションを開始
    await handleStartSession(minutes);
  };

  // セッション開始画面：カスタム入力
  const handleCustomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomMinutes(value);

    if (value) {
      const minutes = parseInt(value, 10);
      if (!isNaN(minutes) && minutes > 0) {
        setSelectedMinutes(minutes);
      } else {
        setSelectedMinutes(null);
      }
    } else {
      setSelectedMinutes(null);
    }

    setStartError("");
  }, []);

  // セッション開始
  const handleStartSession = useCallback(
    async (minutesParam?: number) => {
      // 既にアクティブなセッションがある場合は再開扱いにする
      const currentSession = await storage.get<Session>("currentSession");
      if (currentSession && currentSession.isActive && currentSession.remainingSeconds > 0) {
        const redirectUrl = getRedirectUrl(currentSession.siteId, currentSession.siteUrl);
        if (redirectUrl) {
          window.location.replace(redirectUrl);
        }
        return;
      }

      const minutes = minutesParam ?? selectedMinutes;

      if (!minutes) {
        setStartError("時間を選択してください");
        return;
      }

      if (!targetSiteId) {
        setStartError("対象サイトを選択してください");
        return;
      }

      if (minutes > remainingMinutes) {
        setStartError(`本日の残り利用可能時間は${remainingMinutes}分です`);
        return;
      }

      const redirectUrl = returnUrl || targetSiteRule?.siteUrl || null;
      if (!redirectUrl) {
        setStartError("遷移先URLが設定されていません");
        return;
      }

      setStartLoading(true);
      setStartError("");

      try {
        const response = await sendToBackground({
          name: "start-session",
          body: { durationMinutes: minutes, siteId: targetSiteId, siteUrl: redirectUrl },
        });

        if (response.success) {
          // 履歴を置き換えて対象サイトへ遷移（戻るでセッション開始画面に戻れない）
          window.location.replace(redirectUrl);
        } else {
          setStartError(response.error || "セッションの開始に失敗しました");
        }
      } catch (err) {
        console.error("Error starting session:", err);
        setStartError("セッションの開始に失敗しました");
      } finally {
        setStartLoading(false);
      }
    },
    [remainingMinutes, selectedMinutes, returnUrl, targetSiteId, targetSiteRule, getRedirectUrl],
  );

  // セッション再開（対象サイトへ戻る）
  const handleResumeSession = useCallback(() => {
    if (!activeSession) return;
    const redirectUrl = getRedirectUrl(activeSession.siteId, activeSession.siteUrl);
    if (redirectUrl) {
      window.location.replace(redirectUrl);
    }
  }, [activeSession, getRedirectUrl]);

  const handleSiteChange = useCallback(async (siteId: string) => {
    setTargetSiteId(siteId);
    setSelectedMinutes(null);
    setCustomMinutes("");
    setStartError("");
    const remaining = await getRemainingMinutes(siteId);
    setRemainingMinutes(remaining);
  }, []);

  // セッション終了
  const handleEndSession = useCallback(async () => {
    setStartLoading(true);
    setStartError("");
    try {
      const response = await sendToBackground({
        name: "end-session",
        body: {},
      });

      if (!response.success) {
        setStartError(response.error || "セッションの終了に失敗しました");
        return;
      }

      await loadSessionStartData();
    } catch (err) {
      console.error("Error ending session:", err);
      setStartError("セッションの終了に失敗しました");
    } finally {
      setStartLoading(false);
    }
  }, [loadSessionStartData]);

  return {
    remainingMinutes,
    selectedMinutes,
    customMinutes,
    startLoading,
    startError,
    presets,
    activeSession,
    siteRules,
    targetSiteId,
    targetSiteRule,
    returnUrl,
    loadSessionStartData,
    handlePresetClick,
    handleCustomChange,
    handleStartSession,
    handleResumeSession,
    handleEndSession,
    handleSiteChange,
  };
}
