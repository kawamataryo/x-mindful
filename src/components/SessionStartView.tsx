import { useSessionStart } from "~hooks/useSessionStart";
import { useEffect } from "react";
import { formatTime } from "~lib/timer";
import { FaviconBadge, Button, Surface } from "~components/ui";

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

  // 既にセッション中なら「再開」導線を出す
  if (activeSession && activeSession.isActive && activeSession.remainingSeconds > 0) {
    const remaining = formatTime(activeSession.remainingSeconds);
    return (
      <div className="min-h-screen bg-paper-grain flex items-center justify-center p-4">
        <Surface variant="elevated" className="p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-ink mb-3 text-center">セッション継続中</h2>
          <p className="text-ink-muted text-center mb-2">
            対象サイト:{" "}
            <strong className="text-accent">{activeSiteLabel || activeSession.siteId}</strong>
          </p>
          <p className="text-ink-muted text-center mb-6">
            残り時間: <strong className="text-2xl text-accent">{remaining}</strong>
          </p>

          {startError && (
            <p className="text-danger mb-4 text-sm text-center font-medium">{startError}</p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleResumeSession}
              disabled={startLoading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              対象サイトへ戻る
            </Button>
            <Button
              onClick={handleEndSession}
              disabled={startLoading}
              variant="secondary"
              className="w-full"
            >
              セッションを終了する
            </Button>
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-grain flex items-center justify-center p-4">
      <Surface variant="elevated" className="p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-ink mb-4 text-center">セッション開始</h2>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-ink-muted">対象サイト</label>
          <div className="px-4 py-3 border border-paper-3 rounded-lg text-ink bg-paper-2 flex items-center gap-3">
            <FaviconBadge
              siteUrl={targetSiteRule?.siteUrl || returnUrl || undefined}
              label={targetSiteRule?.label || targetSiteId || undefined}
              size="md"
            />
            <span>{targetSiteRule?.label || targetSiteId || "対象サイトが未設定です"}</span>
          </div>
        </div>

        <p className="text-ink-muted text-center mb-6">
          本日の残り利用可能時間:{" "}
          <strong className="text-2xl text-accent">{remainingMinutes}分</strong>
        </p>

        <div className="mb-6">
          <label className="block mb-3 font-medium text-ink-muted">利用時間を選択</label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || startLoading}
                className={`px-6 py-4 rounded-lg font-semibold text-lg transition-all focus-ring ${
                  selectedMinutes === minutes
                    ? "border-[3px] border-accent bg-paper-2 text-accent shadow-md"
                    : "border border-paper-3 bg-white text-ink"
                } ${
                  minutes > remainingMinutes || startLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-accent hover:shadow-sm"
                }`}
              >
                {minutes}分
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-ink-muted">カスタム時間（分）</label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="例: 15"
            disabled={startLoading}
            className="w-full px-4 py-3 border border-paper-3 rounded-lg bg-white text-ink placeholder-ink-faint text-lg focus:outline-none focus-ring disabled:bg-paper-2 disabled:text-ink-muted"
          />
        </div>

        {startError && (
          <p className="text-danger mb-4 text-sm text-center font-medium">{startError}</p>
        )}

        <Button
          onClick={() => handleStartSession()}
          disabled={!selectedMinutes || startLoading}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {startLoading ? "開始中..." : "セッションを開始"}
        </Button>
      </Surface>
    </div>
  );
}
