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
      className="absolute bottom-3 left-3 rounded border border-neutral-600/80 bg-neutral-900/90 px-2 py-1 text-[11px] font-medium text-neutral-300 transition hover:border-neutral-400/80 hover:text-white"
    >
      {label}
    </button>
  );
}
