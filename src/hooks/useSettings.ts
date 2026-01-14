import { useCallback, useEffect, useRef, useState } from "react";
import type { Settings } from "~lib/types";
import { DEFAULT_SETTINGS } from "~lib/types";
import { getSettings, saveSettings } from "~lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dailyLimit, setDailyLimit] = useState("30");
  const [presetInput, setPresetInput] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const hasLoadedRef = useRef(false);
  const saveSeqRef = useRef(0);
  const lastPersistedRef = useRef<string>("");

  const loadSettings = useCallback(async () => {
    const currentSettings = await getSettings();
    lastPersistedRef.current = JSON.stringify(currentSettings);
    setSettings(currentSettings);
    setDailyLimit(currentSettings.dailyLimitMinutes.toString());
    setPresets(currentSettings.presetMinutes);
    hasLoadedRef.current = true;
  }, []);

  // 自動保存（入力変更から少し待って保存）
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    // 入力途中の空文字は保存しない（typing中の体験を優先）
    if (dailyLimit.trim() === "") return;

    const limit = parseInt(dailyLimit, 10);
    if (isNaN(limit) || limit <= 0) {
      setMessage("1日の制限時間は正の数である必要があります");
      return;
    }

    if (presets.length === 0) {
      setMessage("少なくとも1つのプリセット時間を設定してください");
      return;
    }

    const candidate: Settings = {
      dailyLimitMinutes: limit,
      presetMinutes: presets,
    };
    const candidateKey = JSON.stringify(candidate);
    // ロード直後や、同一値の再セットでは保存しない
    if (candidateKey === lastPersistedRef.current) return;

    const seq = ++saveSeqRef.current;
    const t = window.setTimeout(async () => {
      setSaving(true);
      try {
        await saveSettings(candidate);
        // 古い保存結果で上書きしない
        if (seq !== saveSeqRef.current) return;

        lastPersistedRef.current = candidateKey;
        setSettings(candidate);
        // 成功メッセージは出さない（ノイズになるため）
      } catch (error) {
        console.error("Error saving settings:", error);
        setMessage("設定の保存に失敗しました");
      } finally {
        if (seq === saveSeqRef.current) setSaving(false);
      }
    }, 500);

    return () => window.clearTimeout(t);
  }, [dailyLimit, presets]);

  const handleAddPreset = useCallback(() => {
    const value = parseInt(presetInput, 10);

    if (isNaN(value) || value <= 0) {
      setMessage("プリセット時間は正の数である必要があります");
      return;
    }

    if (presets.includes(value)) {
      setMessage("この時間は既に登録されています");
      return;
    }

    setPresets((prev) => [...prev, value].sort((a, b) => a - b));
    setPresetInput("");
    setMessage("");
  }, [presetInput, presets]);

  const handleRemovePreset = useCallback((value: number) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p !== value);
      if (next.length === 0) {
        setMessage("少なくとも1つのプリセット時間を設定してください");
        return prev;
      }
      return next;
    });
  }, []);

  return {
    settings,
    dailyLimit,
    setDailyLimit,
    presetInput,
    setPresetInput,
    presets,
    saving,
    message,
    loadSettings,
    handleAddPreset,
    handleRemovePreset,
  };
}
