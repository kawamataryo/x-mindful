import { useEffect } from "react";
import { DashboardStats } from "./DashboardStats";
import { SessionHistory } from "./SessionHistory";
import { DailyUsageChart } from "./DailyUsageChart";
import { useDashboard } from "~hooks/useDashboard";
import type { Settings } from "~lib/types";

interface DashboardViewProps {
  settings: Settings;
  reloadKey?: number;
}

export function DashboardView({ settings, reloadKey }: DashboardViewProps) {
  const {
    dashboardLoading,
    siteStats,
    allSessions,
    dailyUsageHistory,
    loadDashboardData,
  } = useDashboard(settings.siteRules);
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

  const getFaviconUrl = (siteUrl?: string) => {
    if (!siteUrl) return null;
    try {
      const host = new URL(siteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">今日の利用状況</h2>
      </div>

      {siteStats.length === 0 ? (
        <div className="text-center text-gray-500 py-8">表示できるサイトがありません</div>
      ) : (
        <div className="space-y-4">
          {siteStats.map((stats) => (
            <div key={stats.siteId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const faviconUrl = getFaviconUrl(stats.siteUrl);
                      return (
                        <div className="w-4 h-4 bg-gray-200 overflow-hidden flex items-center justify-center">
                          {faviconUrl ? (
                            <img src={faviconUrl} alt="" className="w-4 h-4" />
                          ) : (
                            <span className="text-xs text-gray-500">{stats.label.slice(0, 1)}</span>
                          )}
                        </div>
                      );
                    })()}
                    <h3 className="text-lg font-semibold text-gray-800">{stats.label}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartSession(stats.siteId)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    セッションを開始
                  </button>
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
            </div>
          ))}
        </div>
      )}

      {/* 日別利用時間グラフ */}
      <div className="mt-6">
        <DailyUsageChart
          dailyUsageHistory={dailyUsageHistory}
          siteRules={settings.siteRules}
        />
      </div>

      {/* セッション履歴 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">セッション履歴</h3>
        <SessionHistory sessions={allSessions} />
      </div>
    </div>
  );
}
