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
    <Surface variant="elevated" className="p-6 mb-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-ink">今日の利用状況</h2>
      </div>

      {siteStats.length === 0 ? (
        <div className="text-center text-ink-muted py-8">表示できるサイトがありません</div>
      ) : (
        <div className="space-y-4">
          {siteStats.map((stats) => (
            <Surface key={stats.siteId} variant="inset" className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FaviconBadge siteUrl={stats.siteUrl} label={stats.label} size="sm" />
                    <h3 className="text-lg font-semibold text-ink">{stats.label}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleStartSession(stats.siteId)}
                    variant="primary"
                    size="sm"
                  >
                    セッションを開始
                  </Button>
                </div>
              </div>
              <DashboardStats
                dailyLimitMinutes={stats.dailyLimitMinutes}
                remainingMinutes={stats.remainingMinutes}
                usedMinutes={stats.usedMinutes}
                sessionCount={stats.sessionCount}
                loading={dashboardLoading}
                compact
              />
            </Surface>
          ))}
        </div>
      )}

      {/* 日別利用時間グラフ */}
      <div className="mt-6">
        <DailyUsageChart dailyUsageHistory={dailyUsageHistory} siteRules={settings.siteRules} />
      </div>

      {/* セッション履歴 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-ink mb-4">セッション履歴</h3>
        <SessionHistory sessions={allSessions} />
      </div>
    </Surface>
  );
}
