interface DashboardStatsProps {
  dailyLimitMinutes: number;
  remainingMinutes: number;
  usedMinutes: number;
  sessionCount: number;
  loading: boolean;
  compact?: boolean;
}

export function DashboardStats({
  dailyLimitMinutes,
  remainingMinutes,
  usedMinutes,
  sessionCount,
  loading,
  compact = false,
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className={`text-center text-ink-muted ${compact ? "py-4" : "py-8"}`}>読み込み中...</div>
    );
  }

  const gridClass = compact
    ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
    : "grid grid-cols-1 md:grid-cols-3 gap-6";
  const cardPadding = compact ? "p-3" : "p-4";
  const marginBottom = compact ? "mb-0" : "mb-6";

  const isLow = remainingMinutes <= 5;

  return (
    <div className={`${gridClass} ${marginBottom}`}>
      {/* 残り時間カード */}
      <div className={`bg-white rounded-md ${cardPadding} border border-paper-3`}>
        <h3 className="text-sm font-medium text-ink-muted mb-1">残り利用可能時間</h3>
        <p className={`text-2xl font-bold ${isLow ? "text-danger" : "text-accent"}`}>
          {remainingMinutes}分
        </p>
        <p className="text-xs text-ink-faint mt-1">上限: {dailyLimitMinutes}分</p>
      </div>

      {/* 今日の利用時間カード */}
      <div className={`bg-white rounded-md ${cardPadding} border border-paper-3`}>
        <h3 className="text-sm font-medium text-ink-muted mb-1">今日の利用時間</h3>
        <p className="text-2xl font-bold text-success">{usedMinutes}分</p>
        <p className="text-xs text-ink-faint mt-1">
          {dailyLimitMinutes > 0
            ? `${Math.round((usedMinutes / dailyLimitMinutes) * 100)}% 使用`
            : "0% 使用"}
        </p>
      </div>

      {/* セッション数カード */}
      <div className={`bg-white rounded-md ${cardPadding} border border-paper-3`}>
        <h3 className="text-sm font-medium text-ink-muted mb-1">今日のセッション数</h3>
        <p className="text-2xl font-bold text-ink">{sessionCount}回</p>
        <p className="text-xs text-ink-faint mt-1">
          平均:{" "}
          {sessionCount > 0
            ? `${Math.round(usedMinutes / sessionCount)}分/セッション`
            : "0分/セッション"}
        </p>
      </div>
    </div>
  );
}
