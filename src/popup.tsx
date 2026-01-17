import { useEffect } from "react";
import { useSettings } from "~hooks/useSettings";
import { useDashboard } from "~hooks/useDashboard";
import { FaviconBadge, Button, Surface } from "~components/ui";
import "~styles/global.css";

function Popup() {
  const { settings, loadSettings } = useSettings();
  const { siteStats, dashboardLoading, loadDashboardData } = useDashboard(settings.siteRules);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadSettings();
      } catch (error) {
        console.error("Error initializing popup:", error);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDashboardData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.siteRules]);

  const handleOpenDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html"),
    });
  };

  const handleOpenSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/settings.html"),
    });
  };

  return (
    <div className="w-96 min-h-[400px] bg-paper-ruled">
      <div className="p-4">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-ink">サイト利用制限</h1>
          <p className="text-sm text-ink-muted mt-1">今日の利用状況</p>
        </header>

        {dashboardLoading ? (
          <div className="text-center text-ink-muted py-6">読み込み中...</div>
        ) : siteStats.length === 0 ? (
          <div className="text-center text-ink-muted py-6">表示できるサイトがありません</div>
        ) : (
          <div className="space-y-2">
            {siteStats.map((stats, index) => {
              const isLow = stats.remainingMinutes <= 5;
              const delayClass = index < 4 ? `animate-fade-in-up-${index + 1}` : "";
              return (
                <Surface
                  key={stats.siteId}
                  variant="card"
                  className={`flex items-center justify-between gap-3 px-3 py-2 animate-fade-in-up ${delayClass}`}
                >
                  <div className="flex items-center gap-2">
                    <FaviconBadge siteUrl={stats.siteUrl} label={stats.label} size="sm" />
                    <span className="text-sm text-ink">{stats.label}</span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${isLow ? "text-danger animate-pulse-warning" : "text-accent"}`}
                  >
                    残り {stats.remainingMinutes}分
                  </span>
                </Surface>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={handleOpenDashboard} variant="primary" className="w-full">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            ダッシュボードを開く
          </Button>

          <Button onClick={handleOpenSettings} variant="secondary" className="w-full">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            設定を開く
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
