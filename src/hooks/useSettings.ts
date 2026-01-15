import { useCallback, useRef, useState } from "react";
import type { Settings, SiteRule } from "~lib/types";
import { DEFAULT_SETTINGS } from "~lib/types";
import { getSettings, saveSettings } from "~lib/storage";
import { findInvalidPatterns } from "~lib/url-matcher";

type SiteRuleInput = {
  id: string;
  label: string;
  includeInput: string;
  dailyLimitInput: string;
  siteUrlInput: string;
};

function normalizePatternLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function serializeInputs(
  presets: number[],
  siteRulesInput: SiteRuleInput[],
  globalExcludeInput: string,
): string {
  return JSON.stringify({
    presets,
    siteRulesInput,
    globalExcludeInput,
  });
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [presetInput, setPresetInput] = useState("");
  const [presets, setPresets] = useState<number[]>([1, 5, 10, 20]);
  const [siteRulesInput, setSiteRulesInput] = useState<SiteRuleInput[]>([]);
  const [globalExcludeInput, setGlobalExcludeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const hasLoadedRef = useRef(false);
  const saveSeqRef = useRef(0);
  const lastPersistedRef = useRef<string>("");
  const lastInputSerializedRef = useRef<string>("");

  const loadSettings = useCallback(async () => {
    const currentSettings = await getSettings();
    lastPersistedRef.current = JSON.stringify(currentSettings);
    setSettings(currentSettings);
    setPresets(currentSettings.presetMinutes);
    setSiteRulesInput(
      currentSettings.siteRules.map((rule) => ({
        id: rule.id,
        label: rule.label,
        includeInput: rule.includePatterns.join("\n"),
        dailyLimitInput: rule.dailyLimitMinutes.toString(),
        siteUrlInput: rule.siteUrl || "",
      })),
    );
    setGlobalExcludeInput(currentSettings.globalExcludePatterns.join("\n"));
    lastInputSerializedRef.current = serializeInputs(
      currentSettings.presetMinutes,
      currentSettings.siteRules.map((rule) => ({
        id: rule.id,
        label: rule.label,
        includeInput: rule.includePatterns.join("\n"),
        dailyLimitInput: rule.dailyLimitMinutes.toString(),
        siteUrlInput: rule.siteUrl || "",
      })),
      currentSettings.globalExcludePatterns.join("\n"),
    );
    hasLoadedRef.current = true;
  }, []);

  const validateAndBuild = useCallback((): { candidate?: Settings; error?: string } => {
    if (presets.length === 0) {
      return { error: "少なくとも1つのプリセット時間を設定してください" };
    }

    if (siteRulesInput.length === 0) {
      return { error: "少なくとも1つのサイトルールを設定してください" };
    }

    const siteRules: SiteRule[] = [];

    for (const rule of siteRulesInput) {
      if (!rule.label.trim()) {
        return { error: "サイト名は必須です" };
      }

      const limit = parseInt(rule.dailyLimitInput, 10);
      if (isNaN(limit) || limit <= 0) {
        return { error: "サイトごとの上限時間は正の数である必要があります" };
      }

      const includePatterns = normalizePatternLines(rule.includeInput);
      if (includePatterns.length === 0) {
        return { error: "対象URLの正規表現を1つ以上設定してください" };
      }

      const invalidInclude = findInvalidPatterns(includePatterns);
      if (invalidInclude.length > 0) {
        return { error: `無効な正規表現があります: ${invalidInclude[0]}` };
      }

      siteRules.push({
        id: rule.id,
        label: rule.label.trim(),
        includePatterns,
        dailyLimitMinutes: limit,
        siteUrl: rule.siteUrlInput.trim() || undefined,
      });
    }

    const globalExcludePatterns = normalizePatternLines(globalExcludeInput);
    const invalidExclude = findInvalidPatterns(globalExcludePatterns);
    if (invalidExclude.length > 0) {
      return { error: `無効な除外正規表現があります: ${invalidExclude[0]}` };
    }

    return {
      candidate: {
        presetMinutes: presets,
        siteRules,
        globalExcludePatterns,
      },
    };
  }, [presets, siteRulesInput, globalExcludeInput]);

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

  const handleAddSiteRule = useCallback(() => {
    const id = `rule_${Date.now()}`;
    setSiteRulesInput((prev) => [
      ...prev,
      {
        id,
        label: "",
        includeInput: "",
        dailyLimitInput: "30",
        siteUrlInput: "",
      },
    ]);
    setMessage("");
  }, []);

  const handleRemoveSiteRule = useCallback((id: string) => {
    setSiteRulesInput((prev) => {
      const next = prev.filter((rule) => rule.id !== id);
      if (next.length === 0) {
        setMessage("少なくとも1つのサイトルールを設定してください");
        return prev;
      }
      return next;
    });
  }, []);

  const handleUpdateSiteRule = useCallback(
    (id: string, patch: Partial<SiteRuleInput>) => {
      setSiteRulesInput((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
      );
      setMessage("");
    },
    [],
  );

  const hasUnsavedChanges =
    hasLoadedRef.current &&
    serializeInputs(presets, siteRulesInput, globalExcludeInput) !==
      lastInputSerializedRef.current;

  const handleSaveSettings = useCallback(async () => {
    if (!hasLoadedRef.current) return;

    const { candidate, error } = validateAndBuild();
    if (error || !candidate) {
      setMessage(error || "設定内容を確認してください");
      return;
    }

    const candidateKey = JSON.stringify(candidate);
    if (candidateKey === lastPersistedRef.current) {
      setMessage("変更はありません");
      return;
    }

    const seq = ++saveSeqRef.current;
    setSaving(true);
    setMessage("");

    try {
      await saveSettings(candidate);
      if (seq !== saveSeqRef.current) return;

      lastPersistedRef.current = candidateKey;
      lastInputSerializedRef.current = serializeInputs(
        presets,
        siteRulesInput,
        globalExcludeInput,
      );
      setSettings(candidate);
      setMessage("保存しました");
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("設定の保存に失敗しました");
    } finally {
      if (seq === saveSeqRef.current) setSaving(false);
    }
  }, [validateAndBuild, presets, siteRulesInput, globalExcludeInput]);

  return {
    settings,
    presetInput,
    setPresetInput,
    presets,
    siteRulesInput,
    globalExcludeInput,
    saving,
    message,
    hasUnsavedChanges,
    loadSettings,
    handleAddPreset,
    handleRemovePreset,
    handleAddSiteRule,
    handleRemoveSiteRule,
    handleUpdateSiteRule,
    setGlobalExcludeInput,
    handleSaveSettings,
  };
}
