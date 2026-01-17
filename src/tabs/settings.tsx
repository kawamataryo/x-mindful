import { useEffect } from "react";
import { SettingsForm } from "~components/SettingsForm";
import { Button } from "~components/ui";
import { useSettings } from "~hooks/useSettings";
import "~styles/global.css";

function SettingsPage() {
  const {
    presetInput,
    setPresetInput,
    presets,
    siteRulesInput,
    globalExcludeInput,
    setGlobalExcludeInput,
    saving,
    message,
    hasUnsavedChanges,
    loadSettings,
    handleAddPreset,
    handleRemovePreset,
    handleAddSiteRule,
    handleRemoveSiteRule,
    handleUpdateSiteRule,
    handleSaveSettings,
  } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleBack = () => {
    window.location.href = chrome.runtime.getURL("options.html");
  };

  return (
    <div className="min-h-screen bg-paper-grain">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <Button
                onClick={handleBack}
                variant="quiet"
                size="sm"
                title="戻る"
                aria-label="戻る"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-ink">基本設定</h1>
                <p className="text-ink-muted mt-2">対象サイトの利用制限に関する設定を行います</p>
              </div>
            </div>
          </div>
        </header>

        <SettingsForm
          presetInput={presetInput}
          setPresetInput={setPresetInput}
          presets={presets}
          siteRulesInput={siteRulesInput}
          globalExcludeInput={globalExcludeInput}
          setGlobalExcludeInput={setGlobalExcludeInput}
          saving={saving}
          message={message}
          hasUnsavedChanges={hasUnsavedChanges}
          onAddPreset={handleAddPreset}
          onRemovePreset={handleRemovePreset}
          onAddSiteRule={handleAddSiteRule}
          onRemoveSiteRule={handleRemoveSiteRule}
          onUpdateSiteRule={handleUpdateSiteRule}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
}

export default SettingsPage;
