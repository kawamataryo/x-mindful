import { CopyButton } from "./CopyButton";
import { FaviconBadge, Surface } from "~components/ui";
import type { SessionRecordWithDate } from "~hooks/useDashboard";

interface SessionHistoryItemProps {
  session: SessionRecordWithDate;
}

export function SessionHistoryItem({ session }: SessionHistoryItemProps) {
  const sessionDate = new Date(session.startTime);
  const isToday = session.date === new Date().toISOString().split("T")[0];

  return (
    <Surface variant="inset" className="p-3 glass-hover transition-colors">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <FaviconBadge
            siteUrl={session.siteUrl}
            label={session.siteLabel || session.siteId}
            size="sm"
          />
          <span className="text-xs text-content-secondary">
            {session.siteLabel || session.siteId}
          </span>
          <span className="text-xs text-content-tertiary">
            {isToday
              ? "Today"
              : sessionDate.toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
          </span>
          <span className="text-sm text-content">
            {sessionDate.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-xs text-content-tertiary">({session.durationMinutes}min)</span>
        </div>
      </div>
      {session.reflection && (
        <div className="relative group mt-2">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg shadow-sm p-3 pr-10 transition-all duration-150">
            <p className="text-sm text-content whitespace-pre-wrap">{session.reflection}</p>
          </div>
          <CopyButton text={session.reflection} />
        </div>
      )}
    </Surface>
  );
}
