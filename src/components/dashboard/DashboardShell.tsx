import { useEffect } from "react";
import { useCharactersFolderAutoSync } from "../../hooks/useCharactersFolderAutoSync";
import { useDashboardTab } from "../../hooks/useDashboardTab";
import { useCompanionBackgroundToggle } from "../../hooks/useCompanionBackgroundToggle";
import { useDashboardSelectedCompanion } from "../../hooks/useDashboardSelectedCompanion";
import { bootstrapCompanions } from "../../services/companionInstanceManager";
import { CompanionPreview } from "./CompanionPreview";
import { DashboardBackgroundToggle } from "./DashboardBackgroundToggle";
import { DashboardCompanionSwitcher } from "./DashboardCompanionSwitcher";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOptionsPanel } from "./DashboardOptionsPanel";
import { SettingsView } from "./SettingsView";
import { TomojisView } from "./TomojisView";

export function DashboardShell() {
  const { activeTab, setTab } = useDashboardTab();
  const { mode, toggleLabel, cycleMode } = useCompanionBackgroundToggle();
  const {
    controllableInstances,
    selectedInstanceId,
    selectedInstance,
    setSelectedInstanceId,
    isLoading: isSelectionLoading,
  } = useDashboardSelectedCompanion();

  useCharactersFolderAutoSync();

  // spawn windows for enabled companions once when the dashboard opens
  useEffect(() => {
    void bootstrapCompanions();
  }, []);

  return (
    <main className="relative flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <DashboardHeader activeTab={activeTab} onTabChange={setTab} />

      {activeTab === "tomojis" ? (
        <TomojisView />
      ) : activeTab === "dashboard" ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <DashboardCompanionSwitcher
            instances={controllableInstances}
            selectedInstanceId={selectedInstanceId}
            onSelect={setSelectedInstanceId}
          />

          {selectedInstanceId !== null && selectedInstance !== null ? (
            <div className="grid min-h-0 flex-1 grid-cols-2">
              <CompanionPreview instance={selectedInstance} />
              <DashboardOptionsPanel instance={selectedInstance} />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-neutral-500">
              {isSelectionLoading ? "Loading companions…" : "No companions on screen"}
            </div>
          )}

          <DashboardBackgroundToggle
            mode={mode}
            label={toggleLabel}
            onCycle={cycleMode}
          />
        </div>
      ) : (
        <SettingsView />
      )}

    </main>
  );
}
