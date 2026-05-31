import { useEffect, useMemo, useState } from "react";
import { useSettings } from "~hooks/useSettings";
import { useDashboard } from "~hooks/useDashboard";
import { FaviconBadge, Button, Surface } from "~components/ui";
import { addSiteRuleFromUrl } from "~lib/storage";
import { findSiteRuleByOrigin, getSupportedOrigin } from "~lib/site-rule";
import "~styles/global.css";

function Popup() {
  const { settings, loadSettings } = useSettings();
  const { siteStats, dashboardLoading, loadDashboardData } = useDashboard(settings.siteRules);
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [addingSite, setAddingSite] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  const currentOrigin = currentTabUrl ? getSupportedOrigin(currentTabUrl) : null;
  const currentRule = useMemo(
    () => (currentOrigin ? findSiteRuleByOrigin(settings, currentOrigin) : null),
    [currentOrigin, settings],
  );

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
    const loadCurrentTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setCurrentTabUrl(tab?.url || null);
        setCurrentTabId(tab?.id || null);
      } catch (error) {
        console.error("Error loading current tab:", error);
        setCurrentTabUrl(null);
        setCurrentTabId(null);
      }
    };
    loadCurrentTab();
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

  const handleAddCurrentSite = async () => {
    if (!currentTabUrl || addingSite) return;

    setAddingSite(true);
    setAddMessage("");

    try {
      const result = await addSiteRuleFromUrl(currentTabUrl);
      if (result.status === "unsupported") {
        setAddMessage("このページは追加できません");
        return;
      }

      await loadSettings();
      await loadDashboardData(true);
      setAddMessage(result.status === "added" ? "追加しました" : "既に追加されています");

      if (result.status === "added" && currentTabId !== null) {
        await chrome.tabs.reload(currentTabId);
      }
    } catch (error) {
      console.error("Error adding current site:", error);
      setAddMessage("追加に失敗しました");
    } finally {
      setAddingSite(false);
    }
  };

  return (
    <div className="w-96 min-h-[400px] bg-mesh">
      <div className="relative z-10 p-4">
        <header className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-content">Mindful Sites</h1>
          <p className="mt-1 text-sm text-content-secondary">Today</p>
        </header>

        <Surface variant="card" className="mb-3 p-3">
          <div className="flex items-center gap-2">
            <FaviconBadge
              siteUrl={currentOrigin || undefined}
              label={currentOrigin || "Site"}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-content">
                {currentOrigin
                  ? new URL(currentOrigin).hostname
                  : "追加できるサイトを開いてください"}
              </p>
              <p className="truncate text-xs text-content-secondary">
                {currentRule
                  ? `${currentRule.label} として管理中`
                  : currentOrigin || "http/https のページが対象です"}
              </p>
            </div>
            <Button
              onClick={handleAddCurrentSite}
              variant={currentRule ? "secondary" : "primary"}
              size="sm"
              disabled={!currentOrigin || addingSite || !!currentRule}
            >
              {addingSite ? "Adding" : currentRule ? "Added" : "Add"}
            </Button>
          </div>
          {addMessage && <p className="mt-2 text-xs text-content-secondary">{addMessage}</p>}
        </Surface>

        {dashboardLoading ? (
          <div className="text-center text-content-secondary py-6">Loading...</div>
        ) : siteStats.length === 0 ? (
          <div className="text-center text-content-secondary py-6">サイトが設定されていません</div>
        ) : (
          <div className="space-y-2">
            {siteStats.map((stats, index) => {
              const isLow = stats.remainingMinutes <= 5;
              const usedPercent =
                stats.dailyLimitMinutes > 0
                  ? Math.min(100, Math.round((stats.usedMinutes / stats.dailyLimitMinutes) * 100))
                  : 0;
              const delayClass = index < 4 ? `animate-fade-in-up-${index + 1}` : "";
              return (
                <Surface key={stats.siteId} variant="card" className={`p-3 ${delayClass}`}>
                  <div className="flex items-center gap-2">
                    <FaviconBadge siteUrl={stats.siteUrl} label={stats.label} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-content">
                      {stats.label}
                    </span>
                    <span
                      className={`text-sm font-semibold ${isLow ? "text-danger" : "text-content"}`}
                    >
                      {stats.remainingMinutes}m
                    </span>
                  </div>
                  <div className="progress-track mt-3">
                    <div className="progress-fill" style={{ width: `${usedPercent}%` }} />
                  </div>
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
            Dashboard
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
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Popup;
