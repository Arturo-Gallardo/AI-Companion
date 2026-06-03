import type { CompanionBackgroundMode } from "../../types/companionBackground";

interface DashboardBackgroundToggleProps {
  mode: CompanionBackgroundMode;
  label: string;
  onCycle: () => void;
}

export function DashboardBackgroundToggle({
  mode,
  label,
  onCycle,
}: DashboardBackgroundToggleProps) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-pressed={mode === "gray"}
      className="absolute bottom-5 left-5 rounded-md border border-neutral-500/70 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-100 transition hover:border-neutral-300/80 hover:text-white"
    >
      {label}
    </button>
  );
}
