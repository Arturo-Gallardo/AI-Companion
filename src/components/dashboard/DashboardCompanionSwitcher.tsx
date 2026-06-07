import type { CompanionInstance } from "../../types/companionInstance";

interface DashboardCompanionSwitcherProps {
  instances: CompanionInstance[];
  selectedInstanceId: string | null;
  onSelect: (id: string) => void;
}

export function DashboardCompanionSwitcher({
  instances,
  selectedInstanceId,
  onSelect,
}: DashboardCompanionSwitcherProps) {
  if (instances.length <= 1) {
    return null;
  }

  return (
    <div className="flex shrink-0 border-b border-neutral-800 bg-neutral-950 px-6 py-2.5">
      <div
        className="flex min-w-0 gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Companion selection"
      >
        {instances.map((instance) => {
          const isSelected = instance.id === selectedInstanceId;

          return (
            <button
              key={instance.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(instance.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold transition-colors ${
                isSelected
                  ? "bg-white text-black"
                  : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {instance.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
