import type { PlasmoMessaging } from "@plasmohq/messaging";
import { addSessionRecord, getCurrentSession, saveCurrentSession } from "~lib/storage";
import { getElapsedMinutes } from "~lib/timer";
import type { SessionRecord } from "~lib/types";

export type EndSessionRequest = {};

export type EndSessionResponse = {
  success: boolean;
  error?: string;
};

const handler: PlasmoMessaging.MessageHandler<EndSessionRequest, EndSessionResponse> = async (
  req,
  res,
) => {
  try {
    const currentSession = await getCurrentSession();

    if (!currentSession) {
      res.send({
        success: false,
        error: "アクティブなセッションがありません",
      });
      return;
    }

    if (getElapsedMinutes(currentSession) > 0) {
      const record: SessionRecord = {
        id: currentSession.id,
        startTime: currentSession.startTime,
        endTime: Date.now(),
        durationMinutes: getElapsedMinutes(currentSession),
        reflection: "",
        siteId: currentSession.siteId,
        siteUrl: currentSession.siteUrl,
      };

      await addSessionRecord(record);
    }

    await saveCurrentSession(null);

    res.send({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    res.send({
      success: false,
      error: "セッションの終了に失敗しました",
    });
  }
};

export default handler;
