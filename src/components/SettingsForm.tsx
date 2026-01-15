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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">利用制限の設定</h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            {saving ? "保存中..." : "変更後に保存してください"}
          </p>
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || saving}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              hasUnsavedChanges && !saving
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            保存
          </button>
        </div>
      </div>

      {/* プリセット時間 */}
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-600 mb-2">
          プリセット時間（分）
        </label>
        <div className="flex gap-2 flex-wrap mb-3">
          {presets.map((preset) => (
            <div
              key={preset}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg"
            >
              <span>{preset}分</span>
              <button
                onClick={() => onRemovePreset(preset)}
                className="text-blue-600 hover:text-blue-800 font-bold"
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
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onAddPreset}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            追加
          </button>
        </div>
      </div>

      {/* 除外URL */}
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-600 mb-2">
          除外URL（正規表現・複数行）
        </label>
        <textarea
          value={globalExcludeInput}
          onChange={(e) => setGlobalExcludeInput(e.target.value)}
          placeholder="例:\n^https?://example.com/logout\n^https?://example.com/settings"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">1行に1つの正規表現を入力してください</p>
      </div>

      {/* サイトルール */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-base font-medium text-gray-600">サイトルール</label>
          <button
            onClick={onAddSiteRule}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            追加
          </button>
        </div>

        <div className="space-y-4">
          {siteRulesInput.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
              <div className="flex items-center justify-end mb-3 absolute top-2 right-2">
                <button
                  onClick={() => onRemoveSiteRule(rule.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">サイト名</label>
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) => onUpdateSiteRule(rule.id, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    1日の上限時間（分）
                  </label>
                  <input
                    type="number"
                    value={rule.dailyLimitInput}
                    onChange={(e) => onUpdateSiteRule(rule.id, { dailyLimitInput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  対象URL（正規表現・複数行）
                </label>
                <textarea
                  value={rule.includeInput}
                  onChange={(e) => onUpdateSiteRule(rule.id, { includeInput: e.target.value })}
                  placeholder="例:\n^https?://example.com/\n^https?://app.example.com/"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">代表URL</label>
                <input
                  type="url"
                  value={rule.siteUrlInput}
                  onChange={(e) => onUpdateSiteRule(rule.id, { siteUrlInput: e.target.value })}
                  placeholder="例: https://example.com/"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  セッション開始後の遷移先やfavicon表示に利用します
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <p
          className={`mb-4 text-sm ${message.includes("失敗") ? "text-red-600" : "text-green-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
