import { useReflection } from "~hooks/useReflection";
import { Button, Surface } from "~components/ui";

export function ReflectionView() {
  const { reflection, setReflection, reflectionLoading, reflectionError, handleSaveReflection } =
    useReflection();

  const canSave = reflection.trim().length > 0 && !reflectionLoading;

  return (
    <div className="min-h-screen bg-mesh particles particles-extra flex items-center justify-center p-4">
      <Surface variant="elevated" className="p-8 max-w-lg w-full animate-fade-in-up relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-semibold text-gradient mb-3 tracking-tight">
            Session Complete
          </h2>
          <p className="text-lg text-content-secondary">この時間で何を得られましたか？</p>
        </div>

        <div className="mb-6">
          <label className="block mb-3 font-semibold text-content">Reflection</label>
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
            placeholder="例: 新しい技術のトレンドを3つ発見できた"
            rows={5}
            disabled={reflectionLoading}
            className="w-full px-4 py-3 glass-input rounded-lg text-content placeholder-content-tertiary text-base resize-none focus:outline-none focus-ring disabled:opacity-60"
          />
          <p className="text-sm text-content-secondary mt-2">{reflection.trim().length} characters</p>
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
