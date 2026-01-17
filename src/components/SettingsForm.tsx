import { Button, Surface } from "~components/ui";

type SiteRuleInput = {
  id: string;
  label: string;
  includeInput: string;
  dailyLimitInput: string;
  siteUrlInput: string;
};

interface SettingsFormProps {
  presetInput: string;
  setPresetInput: (value: string) => void;
  presets: number[];
  siteRulesInput: SiteRuleInput[];
  globalExcludeInput: string;
  setGlobalExcludeInput: (value: string) => void;
  saving: boolean;
  message: string;
  hasUnsavedChanges: boolean;
  onAddPreset: () => void;
  onRemovePreset: (value: number) => void;
  onAddSiteRule: () => void;
  onRemoveSiteRule: (id: string) => void;
  onUpdateSiteRule: (id: string, patch: Partial<SiteRuleInput>) => void;
  onSave: () => void;
}

export function SettingsForm({
  presetInput,
  setPresetInput,
  presets,
  siteRulesInput,
  globalExcludeInput,
  setGlobalExcludeInput,
  saving,
  message,
  hasUnsavedChanges,
  onAddPreset,
  onRemovePreset,
  onAddSiteRule,
  onRemoveSiteRule,
  onUpdateSiteRule,
  onSave,
}: SettingsFormProps) {
  return (
    <Surface variant="elevated" className="p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-ink">利用制限の設定</h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-muted">
            {saving ? "保存中..." : "変更後に保存してください"}
          </p>
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || saving}
            variant="primary"
            size="sm"
          >
            保存
          </Button>
        </div>
      </div>

      {/* プリセット時間 */}
      <div className="mb-6">
        <label className="block text-base font-medium text-ink-muted mb-2">
          プリセット時間（分）
        </label>
        <div className="flex gap-2 flex-wrap mb-3">
          {presets.map((preset) => (
            <div
              key={preset}
              className="flex items-center gap-2 px-3 py-1.5 bg-paper-2 text-ink border border-paper-3 rounded-md"
            >
              <span>{preset}分</span>
              <button
                onClick={() => onRemovePreset(preset)}
                className="text-ink-muted hover:text-danger font-bold focus-ring rounded"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={presetInput}
            onChange={(e) => setPresetInput(e.target.value)}
            placeholder="例: 15"
            className="px-4 py-2 border border-paper-3 rounded-md bg-white text-ink placeholder-ink-faint focus:outline-none focus-ring"
          />
          <Button onClick={onAddPreset} variant="primary" size="sm">
            追加
          </Button>
        </div>
      </div>

      {/* 除外URL */}
      <div className="mb-6">
        <label className="block text-base font-medium text-ink-muted mb-2">
          除外URL（正規表現・複数行）
        </label>
        <textarea
          value={globalExcludeInput}
          onChange={(e) => setGlobalExcludeInput(e.target.value)}
          placeholder="例:\n^https?://example.com/logout\n^https?://example.com/settings"
          rows={4}
          className="w-full px-4 py-2 border border-paper-3 rounded-md bg-white text-ink placeholder-ink-faint focus:outline-none focus-ring"
        />
        <p className="text-xs text-ink-muted mt-2">1行に1つの正規表現を入力してください</p>
      </div>

      {/* サイトルール */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-base font-medium text-ink-muted">サイトルール</label>
          <Button onClick={onAddSiteRule} variant="primary" size="sm">
            追加
          </Button>
        </div>

        <div className="space-y-4">
          {siteRulesInput.map((rule) => (
            <Surface key={rule.id} variant="inset" className="p-4 relative">
              <div className="flex items-center justify-end mb-3 absolute top-2 right-2">
                <button
                  onClick={() => onRemoveSiteRule(rule.id)}
                  className="text-sm text-danger hover:opacity-80 focus-ring rounded p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-1">サイト名</label>
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) => onUpdateSiteRule(rule.id, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-paper-3 rounded-md bg-white text-ink focus:outline-none focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-1">
                    1日の上限時間（分）
                  </label>
                  <input
                    type="number"
                    value={rule.dailyLimitInput}
                    onChange={(e) => onUpdateSiteRule(rule.id, { dailyLimitInput: e.target.value })}
                    className="w-full px-3 py-2 border border-paper-3 rounded-md bg-white text-ink focus:outline-none focus-ring"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-muted mb-1">
                  対象URL（正規表現・複数行）
                </label>
                <textarea
                  value={rule.includeInput}
                  onChange={(e) => onUpdateSiteRule(rule.id, { includeInput: e.target.value })}
                  placeholder="例:\n^https?://example.com/\n^https?://app.example.com/"
                  rows={4}
                  className="w-full px-3 py-2 border border-paper-3 rounded-md bg-white text-ink focus:outline-none focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1">代表URL</label>
                <input
                  type="url"
                  value={rule.siteUrlInput}
                  onChange={(e) => onUpdateSiteRule(rule.id, { siteUrlInput: e.target.value })}
                  placeholder="例: https://example.com/"
                  className="w-full px-3 py-2 border border-paper-3 rounded-md bg-white text-ink focus:outline-none focus-ring"
                />
                <p className="text-xs text-ink-muted mt-1">
                  セッション開始後の遷移先やfavicon表示に利用します
                </p>
              </div>
            </Surface>
          ))}
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <p className={`mb-4 text-sm ${message.includes("失敗") ? "text-danger" : "text-success"}`}>
          {message}
        </p>
      )}
    </Surface>
  );
}
