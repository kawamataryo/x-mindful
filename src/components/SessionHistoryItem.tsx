import { CopyButton } from "./CopyButton";
import type { SessionRecordWithDate } from "~hooks/useDashboard";

interface SessionHistoryItemProps {
  session: SessionRecordWithDate;
}

export function SessionHistoryItem({ session }: SessionHistoryItemProps) {
  const sessionDate = new Date(session.startTime);
  const isToday = session.date === new Date().toISOString().split("T")[0];
  const faviconUrl = (() => {
    if (!session.siteUrl) return null;
    try {
      const host = new URL(session.siteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      return null;
    }
  })();

  return (
    <div className="bg-gray-50 rounded p-3 border border-gray-200 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 overflow-hidden flex items-center justify-center">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4" />
            ) : (
              <span className="text-[10px] text-gray-500">
                {(session.siteLabel || session.siteId || "?").slice(0, 1)}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {session.siteLabel || session.siteId}
          </span>
          <span className="text-xs text-gray-500">
            {isToday
              ? "今日"
              : sessionDate.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
          </span>
          <span className="text-sm text-gray-700">
            {sessionDate.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-xs text-gray-500">({session.durationMinutes}分)</span>
        </div>
      </div>
      {session.reflection && (
        <div className="relative group mt-2">
          <div className="bg-white rounded border border-gray-300 p-3 pr-10">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.reflection}</p>
          </div>
          <CopyButton text={session.reflection} />
        </div>
      )}
    </div>
  );
}
