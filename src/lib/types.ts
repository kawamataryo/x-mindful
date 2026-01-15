// 設定データ
export interface SiteRule {
  id: string; // サイトID
  label: string; // 表示名
  includePatterns: string[]; // 対象URLの正規表現（文字列）
  dailyLimitMinutes: number; // 1日の総利用時間上限（分）
  siteUrl?: string; // 代表URL（リダイレクトやfavicon取得用）
}

export interface Settings {
  presetMinutes: number[]; // プリセット時間（例: [1, 5, 10, 20]）
  siteRules: SiteRule[]; // サイトルール
  globalExcludePatterns: string[]; // 除外URLの正規表現（文字列）
}

// セッションデータ
export interface Session {
  id: string; // セッションID
  startTime: number; // 開始時刻（timestamp）
  durationMinutes: number; // セッション時間（分）
  remainingSeconds: number; // 残り時間（秒）
  isActive: boolean; // アクティブ状態
  siteId: string; // 対象サイトID
  siteUrl?: string; // セッション開始時のURL
}

// 日次データ
export interface DailyUsage {
  date: string; // YYYY-MM-DD
  siteUsage: Record<string, SiteDailyUsage>; // サイト別の利用状況
}

// セッション記録
export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  reflection: string; // 振り返り内容
  siteId: string; // 対象サイトID
  siteUrl?: string; // セッション開始時のURL
}

export interface SiteDailyUsage {
  siteId: string;
  totalUsedMinutes: number; // 使用済み時間（分）
  sessions: SessionRecord[]; // セッション記録
}

// Storageキー
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  CURRENT_SESSION: "currentSession",
  DAILY_USAGE: "dailyUsage",
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
  presetMinutes: [1, 5, 10, 20], // デフォルトプリセット
  siteRules: [
    {
      id: "x",
      label: "X",
      includePatterns: ["^https?://(twitter|x)\\.com(/|$)"],
      dailyLimitMinutes: 30, // デフォルト: 30分/日
      siteUrl: "https://x.com/home",
    },
  ],
  globalExcludePatterns: [
    "^https?://(twitter|x)\\.com/compose",
    "^https?://(twitter|x)\\.com/messages/compose",
    "^https?://(twitter|x)\\.com/messages",
  ],
};

// 日付フォーマット関数（ローカルTZベース）
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

// 今日の日付を取得（ローカルTZ）
export function getToday(): string {
  return formatDate(new Date());
}
