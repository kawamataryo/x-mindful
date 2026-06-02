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
  if (activeSession && activeSession.remainingSeconds > 0) {
    const remaining = formatTime(activeSession.remainingSeconds);
    return (
      <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
        <Surface
          variant="elevated"
          className="relative z-10 w-full max-w-md animate-fade-in-up p-7"
        >
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-content-secondary">Active session</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-content">{remaining}</h2>
            <p className="mt-2 text-sm text-content-secondary">
              {activeSiteLabel || activeSession.siteId}
            </p>
          </div>

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
    <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
      <Surface variant="elevated" className="relative z-10 w-full max-w-md animate-fade-in-up p-7">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-content">Start session</h2>
          <p className="mt-2 text-sm text-content-secondary">
            Pick a duration, then go back to the site.
          </p>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-content-secondary">Site</label>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-content">
            <FaviconBadge
              siteUrl={targetSiteRule?.siteUrl || returnUrl || undefined}
              label={targetSiteRule?.label || targetSiteId || undefined}
              size="md"
            />
            <span>{targetSiteRule?.label || targetSiteId || "サイトが未設定です"}</span>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold">{remainingMinutes}m</span> remaining today
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-content-secondary">Duration</label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((minutes) => (
              <button
                key={minutes}
                onClick={() => handlePresetClick(minutes)}
                disabled={minutes > remainingMinutes || startLoading}
                className={`rounded-lg border px-6 py-4 text-lg font-semibold transition-all focus-ring ${
                  selectedMinutes === minutes
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-content"
                } ${
                  minutes > remainingMinutes || startLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-blue-300"
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-content-secondary">
            Custom minutes
          </label>
          <input
            type="number"
            value={customMinutes}
            onChange={handleCustomChange}
            placeholder="e.g. 15"
            disabled={startLoading}
            className="w-full px-4 py-3 glass-input rounded-lg text-content placeholder-content-tertiary text-lg focus:outline-none focus-ring disabled:opacity-60"
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
