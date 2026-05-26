import { useSettingsPanel } from "../../hooks/useSettingsPanel";
import { CompanionPreview } from "./CompanionPreview";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOptionsPanel } from "./DashboardOptionsPanel";
import { SettingsPanel } from "./SettingsPanel";

export function DashboardShell() {
  const { isOpen, open, close } = useSettingsPanel();

  return (
    <main className="flex h-screen flex-col bg-neutral-950 text-neutral-100">
      <DashboardHeader onOpenSettings={open} />

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <CompanionPreview />
        <DashboardOptionsPanel />
      </div>

      <SettingsPanel isOpen={isOpen} onClose={close} />
    </main>
  );
}
