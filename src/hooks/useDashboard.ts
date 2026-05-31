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

  const applyUsageHistory = (allDailyUsage: DailyUsage[]) => {
    const siteLabelById = new Map(siteRules.map((rule) => [rule.id, rule.label]));
    const sessionsWithDate: SessionRecordWithDate[] = [];

    allDailyUsage.forEach((dailyUsage) => {
      Object.values(dailyUsage.siteUsage).forEach((siteUsage) => {
        siteUsage.sessions.forEach((session) => {
          sessionsWithDate.push({
            ...session,
            date: dailyUsage.date,
            siteLabel: siteLabelById.get(session.siteId),
          });
        });
      });
    });

    // startTimeでソート（最新順）
    sessionsWithDate.sort((a, b) => b.startTime - a.startTime);

    setAllSessions(sessionsWithDate);
    setDailyUsageHistory(allDailyUsage.slice(0, 30));
  };

  // ダッシュボードデータをロード
  const loadDashboardData = async (skipSessions = false) => {
    setDashboardLoading(true);
    try {
      const todayData = await getDailyUsage();
      const remainingBySite = await Promise.all(
        siteRules.map(async (rule) => [rule.id, await getRemainingMinutes(rule.id)] as const),
      );
      const remainingMinutesBySite = new Map(remainingBySite);

      const nextStats: SiteStats[] = siteRules.map((rule) => {
        const siteUsage = todayData.siteUsage[rule.id];
        return {
          siteId: rule.id,
          label: rule.label,
          dailyLimitMinutes: rule.dailyLimitMinutes,
          remainingMinutes: remainingMinutesBySite.get(rule.id) || 0,
          usedMinutes: siteUsage?.totalUsedMinutes || 0,
          sessionCount: siteUsage?.sessions.length || 0,
          siteUrl: rule.siteUrl,
        };
      });

      setSiteStats(nextStats);

      if (!skipSessions) {
        applyUsageHistory(await getAllDailyUsage());
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
