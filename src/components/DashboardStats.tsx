interface DashboardStatsProps {
  dailyLimitMinutes: number;
  remainingMinutes: number;
  usedMinutes: number;
  sessionCount: number;
  loading: boolean;
}

export function DashboardStats({
  dailyLimitMinutes,
  remainingMinutes,
  usedMinutes,
  sessionCount,
  loading,
}: DashboardStatsProps) {
  if (loading) {
    return <div className="text-sm text-content-secondary">Loading...</div>;
  }

  const usedPercent =
    dailyLimitMinutes > 0 ? Math.min(100, Math.round((usedMinutes / dailyLimitMinutes) * 100)) : 0;
  const remainingIsLow = remainingMinutes <= 5;

  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div>
        <p className="text-content-tertiary">Remaining</p>
        <p
          className={`mt-1 text-xl font-semibold ${remainingIsLow ? "text-danger" : "text-content"}`}
        >
          {remainingMinutes}m
        </p>
      </div>
      <div>
        <p className="text-content-tertiary">Used</p>
        <p className="mt-1 text-xl font-semibold text-content">{usedMinutes}m</p>
      </div>
      <div>
        <p className="text-content-tertiary">Sessions</p>
        <p className="mt-1 text-xl font-semibold text-content">{sessionCount}</p>
      </div>
      <div className="col-span-3">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${usedPercent}%` }} />
        </div>
        <p className="mt-2 text-xs text-content-tertiary">
          {usedPercent}% of {dailyLimitMinutes}m used today
        </p>
      </div>
    </div>
  );
}
