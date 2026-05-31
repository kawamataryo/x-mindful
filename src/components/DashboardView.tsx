import { useEffect } from "react";
import { DashboardStats } from "./DashboardStats";
import { SessionHistory } from "./SessionHistory";
import { DailyUsageChart } from "./DailyUsageChart";
import { FaviconBadge, Button, Surface } from "~components/ui";
import { useDashboard } from "~hooks/useDashboard";
import type { Settings } from "~lib/types";

interface DashboardViewProps {
  settings: Settings;
  reloadKey?: number;
}

export function DashboardView({ settings, reloadKey }: DashboardViewProps) {
  const { dashboardLoading, siteStats, allSessions, dailyUsageHistory, loadDashboardData } =
    useDashboard(settings.siteRules);
  // 初期ロードとリロード
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, settings.siteRules]);

  const handleStartSession = (siteId: string) => {
    const params = new URLSearchParams();
    params.set("view", "start-session");
    params.set("siteId", siteId);
    window.location.href = chrome.runtime.getURL(`options.html?${params.toString()}`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-content tracking-tight">Today</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Choose a site, start a session, then leave when the timer ends.
          </p>
        </div>
      </div>

      {siteStats.length === 0 ? (
        <Surface variant="elevated" className="p-8 text-center text-content-secondary">
          サイトが設定されていません
        </Surface>
      ) : (
        <div className="space-y-3">
          {siteStats.map((stats) => (
            <Surface key={stats.siteId} variant="elevated" className="p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <FaviconBadge siteUrl={stats.siteUrl} label={stats.label} size="md" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-content">{stats.label}</h3>
                    <p className="text-sm text-content-secondary">
                      {stats.remainingMinutes}m available today
                    </p>
                  </div>
                </div>

                <DashboardStats
                  dailyLimitMinutes={stats.dailyLimitMinutes}
                  remainingMinutes={stats.remainingMinutes}
                  usedMinutes={stats.usedMinutes}
                  sessionCount={stats.sessionCount}
                  loading={dashboardLoading}
                />

                <Button
                  onClick={() => handleStartSession(stats.siteId)}
                  variant="primary"
                  size="sm"
                >
                  Start
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DailyUsageChart dailyUsageHistory={dailyUsageHistory} siteRules={settings.siteRules} />
        <Surface variant="elevated" className="p-5">
          <h3 className="mb-4 text-base font-semibold text-content">Recent sessions</h3>
          <SessionHistory sessions={allSessions} />
        </Surface>
      </div>
    </div>
  );
}
