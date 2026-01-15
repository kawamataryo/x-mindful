import { Storage } from "@plasmohq/storage";
import type {
  Settings,
  Session,
  DailyUsage,
  SessionRecord,
  SiteDailyUsage,
  SiteRule,
} from "./types";
import { STORAGE_KEYS, DEFAULT_SETTINGS, getToday } from "./types";

const storage = new Storage();

function buildDefaultSiteRulesFromLegacy(dailyLimitMinutes?: number): SiteRule[] {
  const baseRule = DEFAULT_SETTINGS.siteRules[0];
  return [
    {
      ...baseRule,
      dailyLimitMinutes:
        typeof dailyLimitMinutes === "number" ? dailyLimitMinutes : baseRule.dailyLimitMinutes,
    },
  ];
}

function normalizeSettings(raw: any): Settings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  if (!Array.isArray(raw.siteRules)) {
    return {
      presetMinutes: Array.isArray(raw.presetMinutes)
        ? raw.presetMinutes
        : DEFAULT_SETTINGS.presetMinutes,
      siteRules: buildDefaultSiteRulesFromLegacy(raw.dailyLimitMinutes),
      globalExcludePatterns: DEFAULT_SETTINGS.globalExcludePatterns,
    };
  }

  return {
    presetMinutes: Array.isArray(raw.presetMinutes)
      ? raw.presetMinutes
      : DEFAULT_SETTINGS.presetMinutes,
    siteRules: raw.siteRules,
    globalExcludePatterns: Array.isArray(raw.globalExcludePatterns)
      ? raw.globalExcludePatterns
      : DEFAULT_SETTINGS.globalExcludePatterns,
  };
}

// 設定の取得
export async function getSettings(): Promise<Settings> {
  const settings = await storage.get<Settings>(STORAGE_KEYS.SETTINGS);
  const normalized = normalizeSettings(settings);

  if (!settings || JSON.stringify(settings) !== JSON.stringify(normalized)) {
    await saveSettings(normalized);
  }

  return normalized;
}

// 設定の保存
export async function saveSettings(settings: Settings): Promise<void> {
  await storage.set(STORAGE_KEYS.SETTINGS, settings);
}

// 現在のセッションの取得
export async function getCurrentSession(): Promise<Session | null> {
  const session = await storage.get<Session>(STORAGE_KEYS.CURRENT_SESSION);
  if (!session) return null;

  if (!session.siteId) {
    const settings = await getSettings();
    const defaultSiteId = settings.siteRules[0]?.id || "default";
    const migrated = {
      ...session,
      siteId: defaultSiteId,
      siteUrl: session.siteUrl || settings.siteRules[0]?.siteUrl,
    };
    await saveCurrentSession(migrated);
    return migrated;
  }

  return session;
}

// 現在のセッションの保存
export async function saveCurrentSession(session: Session | null): Promise<void> {
  if (session === null) {
    await storage.remove(STORAGE_KEYS.CURRENT_SESSION);
  } else {
    await storage.set(STORAGE_KEYS.CURRENT_SESSION, session);
  }
}

// 日次データの取得
function buildEmptySiteUsage(siteId: string): SiteDailyUsage {
  return {
    siteId,
    totalUsedMinutes: 0,
    sessions: [],
  };
}

function normalizeDailyUsage(raw: any, defaultSiteId: string, date: string): DailyUsage {
  if (!raw) {
    return {
      date,
      siteUsage: {},
    };
  }

  if (raw.siteUsage) {
    const normalizedSiteUsage: Record<string, SiteDailyUsage> = {};
    Object.entries(raw.siteUsage as Record<string, SiteDailyUsage>).forEach(([siteId, usage]) => {
      normalizedSiteUsage[siteId] = {
        siteId,
        totalUsedMinutes: usage.totalUsedMinutes || 0,
        sessions: Array.isArray(usage.sessions)
          ? usage.sessions.map((session) => ({
              ...session,
              siteId: session.siteId || siteId,
            }))
          : [],
      };
    });

    return {
      date: raw.date || date,
      siteUsage: normalizedSiteUsage,
    };
  }

  // 旧形式: totalUsedMinutes / sessions
  const legacySessions: SessionRecord[] = Array.isArray(raw.sessions)
    ? raw.sessions.map((session: SessionRecord) => ({
        ...session,
        siteId: session.siteId || defaultSiteId,
      }))
    : [];

  return {
    date: raw.date || date,
    siteUsage: {
      [defaultSiteId]: {
        siteId: defaultSiteId,
        totalUsedMinutes: raw.totalUsedMinutes || 0,
        sessions: legacySessions,
      },
    },
  };
}

export async function getDailyUsage(date?: string): Promise<DailyUsage> {
  const targetDate = date || getToday();
  const allDailyUsage =
    (await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE)) || {};
  const settings = await getSettings();
  const defaultSiteId = settings.siteRules[0]?.id || "default";

  const normalized = normalizeDailyUsage(allDailyUsage[targetDate], defaultSiteId, targetDate);
  const currentSerialized = JSON.stringify(allDailyUsage[targetDate]);
  const normalizedSerialized = JSON.stringify(normalized);

  if (!allDailyUsage[targetDate] || currentSerialized !== normalizedSerialized) {
    allDailyUsage[targetDate] = normalized;
    await storage.set(STORAGE_KEYS.DAILY_USAGE, allDailyUsage);
  }

  return normalized;
}

// 日次データの保存
export async function saveDailyUsage(dailyUsage: DailyUsage): Promise<void> {
  const allDailyUsage =
    (await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE)) || {};
  allDailyUsage[dailyUsage.date] = dailyUsage;
  await storage.set(STORAGE_KEYS.DAILY_USAGE, allDailyUsage);
}

// セッション記録の追加
export async function addSessionRecord(record: SessionRecord): Promise<void> {
  const today = getToday();
  const dailyUsage = await getDailyUsage(today);
  const siteId = record.siteId;

  if (!dailyUsage.siteUsage[siteId]) {
    dailyUsage.siteUsage[siteId] = buildEmptySiteUsage(siteId);
  }

  dailyUsage.siteUsage[siteId].sessions.push(record);
  dailyUsage.siteUsage[siteId].totalUsedMinutes += record.durationMinutes;

  await saveDailyUsage(dailyUsage);
}

// 全日次データの取得（履歴表示用）
export async function getAllDailyUsage(): Promise<DailyUsage[]> {
  const allDailyUsage =
    (await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE)) || {};
  const settings = await getSettings();
  const defaultSiteId = settings.siteRules[0]?.id || "default";
  const normalizedEntries: Record<string, DailyUsage> = {};

  for (const [date, usage] of Object.entries(allDailyUsage)) {
    normalizedEntries[date] = normalizeDailyUsage(usage, defaultSiteId, date);
  }

  if (JSON.stringify(allDailyUsage) !== JSON.stringify(normalizedEntries)) {
    await storage.set(STORAGE_KEYS.DAILY_USAGE, normalizedEntries);
  }

  return Object.values(normalizedEntries).sort((a, b) => b.date.localeCompare(a.date));
}

// 残り利用可能時間の計算
export async function getRemainingMinutes(siteId: string): Promise<number> {
  const settings = await getSettings();
  const dailyUsage = await getDailyUsage();
  const currentSession = await getCurrentSession();

  const targetRule = settings.siteRules.find((rule) => rule.id === siteId);
  const dailyLimit = targetRule?.dailyLimitMinutes ?? 0;
  const siteUsage = dailyUsage.siteUsage[siteId] || buildEmptySiteUsage(siteId);
  let usedMinutes = siteUsage.totalUsedMinutes;

  // 現在アクティブなセッションの使用時間を加算（同じサイトのみ）
  if (currentSession && currentSession.isActive && currentSession.siteId === siteId) {
    const elapsedSeconds = currentSession.durationMinutes * 60 - currentSession.remainingSeconds;
    usedMinutes += Math.floor(elapsedSeconds / 60);
  }

  return Math.max(0, dailyLimit - usedMinutes);
}

// ストレージの初期化（初回起動時）
export async function initializeStorage(): Promise<void> {
  const settings = await storage.get<Settings>(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    await saveSettings(DEFAULT_SETTINGS);
  }
}
