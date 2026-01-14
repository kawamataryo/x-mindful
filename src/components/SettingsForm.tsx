interface SettingsFormProps {
  dailyLimit: string;
  setDailyLimit: (value: string) => void;
  presetInput: string;
  setPresetInput: (value: string) => void;
  presets: number[];
  saving: boolean;
  message: string;
  onAddPreset: () => void;
  onRemovePreset: (value: number) => void;
}

export function SettingsForm({
  dailyLimit,
  setDailyLimit,
  presetInput,
  setPresetInput,
  presets,
  saving,
  message,
  onAddPreset,
  onRemovePreset,
}: SettingsFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">利用制限の設定</h2>
        <p className="text-xs text-gray-500">
          {saving ? "自動保存中..." : "変更は自動で保存されます"}
        </p>
      </div>

      {/* 1日の利用時間上限 */}
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-600 mb-2">
          1日の総利用時間上限（分）
        </label>
        <input
          type="number"
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
