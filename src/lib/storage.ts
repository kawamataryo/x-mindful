import { Storage } from "@plasmohq/storage";
import type {
  Settings,
  Session,
  DailyUsage,
  SessionRecord,
  SiteDailyUsage,
  SiteRule,
} from "./types";
import { STORAGE_KEYS, DEFAULT_SETTINGS, getToday, formatDate } from "./types";
import { getElapsedMinutes } from "./timer";
import { buildSiteRuleFromUrl, type AddSiteRuleResult } from "./site-rule";

const storage = new Storage();
const DAILY_USAGE_KEY_PREFIX = `${STORAGE_KEYS.DAILY_USAGE}:`;

function getDailyUsageKey(date: string): string {
  return `${DAILY_USAGE_KEY_PREFIX}${date}`;
}

async function getDailyUsageIndex(): Promise<string[]> {
  const index = await storage.get<string[]>(STORAGE_KEYS.DAILY_USAGE_INDEX);
  return Array.isArray(index) ? index : [];
}

async function saveDailyUsageIndex(index: string[]): Promise<void> {
  await storage.set(STORAGE_KEYS.DAILY_USAGE_INDEX, index);
}

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

export async function addSiteRuleFromUrl(
  rawUrl: string,
  title?: string,
): Promise<AddSiteRuleResult> {
  const settings = await getSettings();
  const result = buildSiteRuleFromUrl(settings, rawUrl, title);

  if (result.status !== "added") {
    return result;
  }

  await saveSettings({
    ...settings,
    siteRules: [...settings.siteRules, result.rule],
  });

  return result;
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
  const settings = await getSettings();
  const defaultSiteId = settings.siteRules[0]?.id || "default";

  const dailyUsageKey = getDailyUsageKey(targetDate);
  const storedUsage = await storage.get<DailyUsage>(dailyUsageKey);

  if (storedUsage) {
    const normalized = normalizeDailyUsage(storedUsage, defaultSiteId, targetDate);
    const currentSerialized = JSON.stringify(storedUsage);
    const normalizedSerialized = JSON.stringify(normalized);

    if (currentSerialized !== normalizedSerialized) {
      await saveDailyUsage(normalized);
    }

    return normalized;
  }

  const legacyAll = (await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE)) || {};
  const legacyUsage = legacyAll[targetDate];
  const normalized = normalizeDailyUsage(legacyUsage, defaultSiteId, targetDate);

  if (legacyUsage) {
    await saveDailyUsage(normalized);
  }

  return normalized;
}

// 日次データの保存
export async function saveDailyUsage(dailyUsage: DailyUsage): Promise<void> {
  const dailyUsageKey = getDailyUsageKey(dailyUsage.date);
  await storage.set(dailyUsageKey, dailyUsage);

  const index = await getDailyUsageIndex();
  if (!index.includes(dailyUsage.date)) {
    index.push(dailyUsage.date);
    await saveDailyUsageIndex(index);
  }
}

// セッション記録の追加
export async function addSessionRecord(record: SessionRecord): Promise<void> {
  const usageDate = formatDate(new Date(record.startTime));
  const dailyUsage = await getDailyUsage(usageDate);
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
  const settings = await getSettings();
  const defaultSiteId = settings.siteRules[0]?.id || "default";
  const index = await getDailyUsageIndex();
  const normalizedEntries: Record<string, DailyUsage> = {};

  if (index.length > 0) {
    const records = await Promise.all(
      index.map(async (date) => {
        const usage = await storage.get<DailyUsage>(getDailyUsageKey(date));
        if (!usage) {
          return { date, usage: null };
        }

        const normalized = normalizeDailyUsage(usage, defaultSiteId, date);
        if (JSON.stringify(usage) !== JSON.stringify(normalized)) {
          await saveDailyUsage(normalized);
        }

        return { date, usage: normalized };
      }),
    );
    const existingDates: string[] = [];
    records.forEach((record) => {
      if (record.usage) {
        normalizedEntries[record.usage.date] = record.usage;
        existingDates.push(record.date);
      }
    });
    if (existingDates.length !== index.length) {
      await saveDailyUsageIndex(existingDates);
    }
  }

  const legacyAll = (await storage.get<Record<string, DailyUsage>>(STORAGE_KEYS.DAILY_USAGE)) || {};
  const legacyDates = Object.keys(legacyAll);

  if (legacyDates.length > 0) {
    for (const [date, usage] of Object.entries(legacyAll)) {
      const normalized = normalizeDailyUsage(usage, defaultSiteId, date);
      normalizedEntries[normalized.date] = normalized;
      await saveDailyUsage(normalized);
    }
    await storage.remove(STORAGE_KEYS.DAILY_USAGE);
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

  // 現在進行中のセッションの使用時間を加算（同じサイトのみ）
  if (currentSession && currentSession.remainingSeconds > 0 && currentSession.siteId === siteId) {
    usedMinutes += getElapsedMinutes(currentSession);
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
