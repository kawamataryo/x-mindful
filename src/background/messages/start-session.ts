import type { PlasmoMessaging } from "@plasmohq/messaging";
import { getCurrentSession, saveCurrentSession, getRemainingMinutes, getSettings } from "~lib/storage";
import { createSession } from "~lib/timer";

export type StartSessionRequest = {
  durationMinutes: number;
  siteId: string;
  siteUrl?: string;
};

export type StartSessionResponse = {
  success: boolean;
  error?: string;
  session?: any;
};

const handler: PlasmoMessaging.MessageHandler<StartSessionRequest, StartSessionResponse> = async (
  req,
  res,
) => {
  try {
    const { durationMinutes, siteId, siteUrl } = req.body;

    // バリデーション: 時間が正の数であること
    if (!durationMinutes || durationMinutes <= 0) {
      res.send({
        success: false,
        error: "セッション時間は正の数である必要があります",
      });
      return;
    }

    if (!siteId) {
      res.send({
        success: false,
        error: "対象サイトが選択されていません",
      });
      return;
    }

    const settings = await getSettings();
    const targetRule = settings.siteRules.find((rule) => rule.id === siteId);
    if (!targetRule) {
      res.send({
        success: false,
        error: "対象サイトの設定が見つかりません",
      });
      return;
    }

    // 既存のアクティブセッションがないかチェック
    const existingSession = await getCurrentSession();
    if (existingSession && existingSession.isActive) {
      res.send({
        success: false,
        error: "既にアクティブなセッションが存在します",
      });
      return;
    }

    // 残り利用可能時間をチェック
    const remainingMinutes = await getRemainingMinutes(siteId);
    if (durationMinutes > remainingMinutes) {
      res.send({
        success: false,
        error: `本日の残り利用可能時間は${remainingMinutes}分です`,
      });
      return;
    }

    // 新しいセッションを作成
    const newSession = createSession(durationMinutes, siteId, siteUrl);
    await saveCurrentSession(newSession);

    res.send({
      success: true,
      session: newSession,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.send({
      success: false,
      error: "セッションの開始に失敗しました",
    });
  }
};

export default handler;
