import { useEffect } from "react";
import { SettingsForm } from "~components/SettingsForm";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="戻る"
                aria-label="戻る"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">基本設定</h1>
                <p className="text-gray-600 mt-2">対象サイトの利用制限に関する設定を行います</p>
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
