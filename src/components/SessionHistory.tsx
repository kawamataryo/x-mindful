import { useState } from "react";
import { SessionHistoryItem } from "./SessionHistoryItem";
import { Button } from "~components/ui";
import type { SessionRecordWithDate } from "~hooks/useDashboard";

interface SessionHistoryProps {
  sessions: SessionRecordWithDate[];
}

const SESSIONS_PER_PAGE = 5;

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = startIndex + SESSIONS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-content-secondary">
        <p>No sessions yet</p>
        <p className="text-sm mt-2">セッションを開始して、意図的な利用を始めましょう</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {currentSessions.map((session) => (
          <SessionHistoryItem key={session.id} session={session} />
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
          >
            Prev
          </Button>
          <span className="text-sm text-content-secondary">
            {currentPage} / {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
