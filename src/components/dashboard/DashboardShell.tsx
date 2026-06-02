import { useDashboardTab } from "../../hooks/useDashboardTab";
import { CompanionPreview } from "./CompanionPreview";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOptionsPanel } from "./DashboardOptionsPanel";
import { SettingsView } from "./SettingsView";

export function DashboardShell() {
  const { activeTab, setTab } = useDashboardTab();

  return (
    <main className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <DashboardHeader activeTab={activeTab} onTabChange={setTab} />

      {activeTab === "dashboard" ? (
        <div className="grid min-h-0 flex-1 grid-cols-2">
          <CompanionPreview />
          <DashboardOptionsPanel />
        </div>
      ) : (
        <SettingsView />
      )}
    </main>
  );
}
