import { useReflection } from "~hooks/useReflection";
import { Button, Surface } from "~components/ui";

export function ReflectionView() {
  const { reflection, setReflection, reflectionLoading, reflectionError, handleSaveReflection } =
    useReflection();

  const canSave = reflection.trim().length > 0 && !reflectionLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh p-4">
      <Surface variant="elevated" className="relative z-10 w-full max-w-lg animate-fade-in-up p-7">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight text-content">Reflect</h2>
          <p className="text-content-secondary">
            何をしに来て、何ができましたか。ひとこと残して終了します。
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-content-secondary">
            Reflection
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            onKeyDown={(e) => {
              // ⌘+Enter で「保存して終了」と同じ処理を実行する
              if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                if (canSave) handleSaveReflection();
              }
            }}
            placeholder="例: 目的の投稿だけ確認できた。次回も5分で終える。"
            rows={5}
            disabled={reflectionLoading}
            className="w-full px-4 py-3 glass-input rounded-lg text-content placeholder-content-tertiary text-base resize-none focus:outline-none focus-ring disabled:opacity-60"
          />
          <p className="text-sm text-content-secondary mt-2">
            {reflection.trim().length} characters
          </p>
        </div>

        {reflectionError && (
          <p className="text-danger mb-4 text-sm text-center font-medium">{reflectionError}</p>
        )}

        <Button
          onClick={handleSaveReflection}
          disabled={!canSave}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {reflectionLoading ? "Saving..." : "Save & Finish"}
        </Button>

        <p className="text-sm text-content-secondary text-center mt-4">
          振り返りを入力するまで、対象サイトにアクセスできません
        </p>
      </Surface>
    </div>
  );
}
