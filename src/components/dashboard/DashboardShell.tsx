import { useDashboardTab } from "../../hooks/useDashboardTab";
import { useCompanionBackgroundToggle } from "../../hooks/useCompanionBackgroundToggle";
import { CompanionPreview } from "./CompanionPreview";
import { DashboardBackgroundToggle } from "./DashboardBackgroundToggle";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOptionsPanel } from "./DashboardOptionsPanel";
import { SettingsView } from "./SettingsView";

export function DashboardShell() {
  const { activeTab, setTab } = useDashboardTab();
  const { mode, toggleLabel, cycleMode } = useCompanionBackgroundToggle();

  return (
    <main className="relative flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <DashboardHeader activeTab={activeTab} onTabChange={setTab} />

      {activeTab === "dashboard" ? (
        <div className="grid min-h-0 flex-1 grid-cols-2">
          <CompanionPreview />
          <DashboardOptionsPanel />
        </div>
      ) : (
        <SettingsView />
      )}

      <DashboardBackgroundToggle
        mode={mode}
        label={toggleLabel}
        onCycle={cycleMode}
      />
    </main>
  );
}
