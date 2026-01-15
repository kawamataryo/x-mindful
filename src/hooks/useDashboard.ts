import { useState } from "react";
import type { DailyUsage, SessionRecord, SiteRule } from "~lib/types";
import { getAllDailyUsage, getDailyUsage, getRemainingMinutes } from "~lib/storage";

// セッション記録に日付情報を追加した型
export interface SessionRecordWithDate extends SessionRecord {
  date: string;
  siteLabel?: string;
}

export interface SiteStats {
  siteId: string;
  label: string;
  dailyLimitMinutes: number;
  remainingMinutes: number;
  usedMinutes: number;
  sessionCount: number;
  siteUrl?: string;
}

export function useDashboard(siteRules: SiteRule[]) {
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<SessionRecordWithDate[]>([]);
  const [dailyUsageHistory, setDailyUsageHistory] = useState<DailyUsage[]>([]);

  // 全セッション履歴を取得（最新順）
  const loadAllSessions = async () => {
    try {
      const allDailyUsage = await getAllDailyUsage();
      const sessionsWithDate: SessionRecordWithDate[] = [];

      allDailyUsage.forEach((dailyUsage) => {
        Object.values(dailyUsage.siteUsage).forEach((siteUsage) => {
          siteUsage.sessions.forEach((session) => {
            const siteLabel = siteRules.find((rule) => rule.id === session.siteId)?.label;
            sessionsWithDate.push({
              ...session,
              date: dailyUsage.date,
              siteLabel,
            });
          });
        });
      });

      // startTimeでソート（最新順）
      sessionsWithDate.sort((a, b) => b.startTime - a.startTime);

      setAllSessions(sessionsWithDate);
    } catch (error) {
      console.error("Error loading all sessions:", error);
    }
  };

  // 日別利用時間履歴を取得（直近30日分）
  const loadDailyUsageHistory = async () => {
    try {
      const allDailyUsage = await getAllDailyUsage();
      // 最新30日分に制限
      const recentUsage = allDailyUsage.slice(0, 30);
      setDailyUsageHistory(recentUsage);
    } catch (error) {
      console.error("Error loading daily usage history:", error);
    }
  };

  // ダッシュボードデータをロード
  const loadDashboardData = async (skipSessions = false) => {
    setDashboardLoading(true);
    try {
      const todayData = await getDailyUsage();
      const nextStats: SiteStats[] = [];

      for (const rule of siteRules) {
        const siteUsage = todayData.siteUsage[rule.id];
        const remaining = await getRemainingMinutes(rule.id);
        nextStats.push({
          siteId: rule.id,
          label: rule.label,
          dailyLimitMinutes: rule.dailyLimitMinutes,
          remainingMinutes: remaining,
          usedMinutes: siteUsage?.totalUsedMinutes || 0,
          sessionCount: siteUsage?.sessions.length || 0,
          siteUrl: rule.siteUrl,
        });
      }

      setSiteStats(nextStats);

      if (!skipSessions) {
        await loadAllSessions();
        await loadDailyUsageHistory();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  return {
    siteStats,
    dashboardLoading,
    allSessions,
    dailyUsageHistory,
    loadDashboardData,
  };
}
