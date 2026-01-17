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
      <div className={`text-center text-content-secondary ${compact ? "py-4" : "py-8"}`}>
        Loading...
      </div>
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
      <div
        className={`bg-white/50 backdrop-blur-sm rounded-lg ${cardPadding} border border-white/40 ${isLow ? "border-danger/40" : ""}`}
      >
        <h3 className="text-sm font-medium text-content-secondary mb-1">Time Remaining</h3>
        <p
          className={`text-2xl font-bold ${isLow ? "text-danger animate-pulse-warning" : "text-gradient"}`}
        >
          {remainingMinutes}min
        </p>
        <p className="text-xs text-content-tertiary mt-1">Limit: {dailyLimitMinutes}min</p>
      </div>

      {/* 今日の利用時間カード */}
      <div className={`bg-white/50 backdrop-blur-sm rounded-lg ${cardPadding} border border-white/40`}>
        <h3 className="text-sm font-medium text-content-secondary mb-1">Time Used</h3>
        <p className="text-2xl font-bold text-success">{usedMinutes}min</p>
        <p className="text-xs text-content-tertiary mt-1">
          {dailyLimitMinutes > 0
            ? `${Math.round((usedMinutes / dailyLimitMinutes) * 100)}% used`
            : "0% used"}
        </p>
      </div>

      {/* セッション数カード */}
      <div className={`bg-white/50 backdrop-blur-sm rounded-lg ${cardPadding} border border-white/40`}>
        <h3 className="text-sm font-medium text-content-secondary mb-1">Sessions</h3>
        <p className="text-2xl font-bold text-content">{sessionCount}</p>
        <p className="text-xs text-content-tertiary mt-1">
          Avg:{" "}
          {sessionCount > 0 ? `${Math.round(usedMinutes / sessionCount)}min/session` : "0min"}
        </p>
      </div>
    </div>
  );
}
