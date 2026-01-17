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
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <Surface variant="elevated" className="p-8 max-w-md w-full animate-fade-in-up">
          <h2 className="text-3xl font-semibold text-content mb-3 text-center tracking-tight">
            Session Active
          </h2>
          <p className="text-content-secondary text-center mb-2">
            サイト:{" "}
            <strong className="text-accent">{activeSiteLabel || activeSession.siteId}</strong>
          </p>
          <p className="text-content-secondary text-center mb-6">
            残り: <strong className="text-2xl text-accent">{remaining}</strong>
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
              Continue to Site
            </Button>
            <Button
              onClick={handleEndSession}
              disabled={startLoading}
              variant="secondary"
              className="w-full"
            >
              End Session
            </Button>
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <Surface variant="elevated" className="p-8 max-w-md w-full animate-fade-in-up">
        <h2 className="text-3xl font-semibold text-content mb-4 text-center tracking-tight">
          Start Session
        </h2>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-content-secondary">Target Site</label>
          <div className="px-4 py-3 border border-base-muted rounded-md text-content bg-base-subtle flex items-center gap-3">
            <FaviconBadge
              siteUrl={targetSiteRule?.siteUrl || returnUrl || undefined}
              label={targetSiteRule?.label || targetSiteId || undefined}
              size="md"
            />
            <span>{targetSiteRule?.label || targetSiteId || "サイトが未設定です"}</span>
          </div>
        </div>

        <p className="text-content-secondary text-center mb-6">
          Time Remaining Today:{" "}
          <strong className="text-2xl text-accent">{remainingMinutes}min</strong>
        </p>

        <div className="mb-6">
          <label className="block mb-3 font-medium text-content-secondary">Select Duration</label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || startLoading}
                className={`px-6 py-4 rounded-md font-semibold text-lg transition-all focus-ring ${
                  selectedMinutes === minutes
                    ? "border-2 border-accent bg-base-subtle text-accent shadow-sm"
                    : "border border-base-muted bg-white text-content"
                } ${
                  minutes > remainingMinutes || startLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-accent hover:shadow-sm"
                }`}
              >
                {minutes}min
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium text-content-secondary">Custom (minutes)</label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="e.g. 15"
            disabled={startLoading}
            className="w-full px-4 py-3 border border-base-muted rounded-md bg-white text-content placeholder-content-tertiary text-lg focus:outline-none focus-ring disabled:bg-base-subtle disabled:text-content-secondary"
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
          {startLoading ? "Starting..." : "Start Session"}
        </Button>
      </Surface>
    </div>
  );
}
