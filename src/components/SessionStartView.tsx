import { useSessionStart } from "~hooks/useSessionStart";
import { useEffect } from "react";
import { formatTime } from "~lib/timer";

export function SessionStartView() {
  const {
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
  } = useSessionStart();

  const activeSiteLabel =
    activeSession && siteRules.find((rule) => rule.id === activeSession.siteId)?.label;

  useEffect(() => {
    loadSessionStartData();
  }, [loadSessionStartData]);

  // 既にセッション中なら「再開」導線を出す（戻る/Reload等でここに来ても継続できる）
  if (activeSession && activeSession.isActive && activeSession.remainingSeconds > 0) {
    const remaining = formatTime(activeSession.remainingSeconds);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 text-center">セッション継続中</h2>
          <p className="text-gray-600 text-center mb-2">
            対象サイト:{" "}
            <strong className="text-blue-600">{activeSiteLabel || activeSession.siteId}</strong>
          </p>
          <p className="text-gray-600 text-center mb-6">
            残り時間: <strong className="text-2xl text-blue-600">{remaining}</strong>
          </p>

          {startError && (
            <p className="text-red-600 mb-4 text-sm text-center font-medium">{startError}</p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleResumeSession}
              disabled={startLoading}
              className="w-full px-4 py-4 text-white border-none rounded-xl text-lg font-bold transition-all bg-blue-500 hover:bg-blue-600 cursor-pointer shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              対象サイトへ戻る
            </button>
            <button
              onClick={handleEndSession}
              disabled={startLoading}
              className="w-full px-4 py-3 rounded-xl text-base font-semibold transition-all bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              セッションを終了する
            </button>
          </div>
        </div>
      </div>
    );
  }

  const faviconUrl = (() => {
    const fallbackUrl = targetSiteRule?.siteUrl || returnUrl;
    if (!fallbackUrl) return null;
    try {
      const host = new URL(fallbackUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">利用セッション開始</h2>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">対象サイト</label>
          <div className="px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 bg-gray-50 flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
              {faviconUrl ? (
                <img src={faviconUrl} alt="" className="w-6 h-6" />
              ) : (
                <span className="text-xs text-gray-500">
                  {(targetSiteRule?.label || targetSiteId || "?").slice(0, 1)}
                </span>
              )}
            </div>
            <span>{targetSiteRule?.label || targetSiteId || "対象サイトが未設定です"}</span>
          </div>
        </div>

        <p className="text-gray-600 text-center mb-6">
          本日の残り利用可能時間:{" "}
          <strong className="text-2xl text-blue-600">{remainingMinutes}分</strong>
        </p>

        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-700">利用時間を選択</label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || startLoading}
                className={`px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                  selectedMinutes === minutes
                    ? "border-3 border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                    : "border-2 border-gray-300 bg-white text-gray-700"
                } ${
                  minutes > remainingMinutes || startLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {minutes}分
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">カスタム時間（分）</label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="例: 15"
            disabled={startLoading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {startError && (
          <p className="text-red-600 mb-4 text-sm text-center font-medium">{startError}</p>
        )}

        <button
          onClick={() => handleStartSession()}
          disabled={!selectedMinutes || startLoading}
          className={`w-full px-4 py-4 text-white border-none rounded-xl text-lg font-bold transition-all ${
            selectedMinutes && !startLoading
              ? "bg-blue-500 hover:bg-blue-600 cursor-pointer shadow-lg hover:shadow-xl"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {startLoading ? "開始中..." : "セッションを開始"}
        </button>
      </div>
    </div>
  );
}
