interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLACEHOLDER_SECTIONS = [
  { title: "Companion", description: "Sprite and behavior preferences" },
  { title: "Notifications", description: "Focus reminders and alerts" },
  { title: "Appearance", description: "Theme and dashboard layout" },
] as const;

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="relative z-10 flex h-full w-80 flex-col border-l border-neutral-600/80 bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-600/80 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
            {PLACEHOLDER_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="rounded-xl border border-neutral-600/70 bg-neutral-900/50 px-4 py-3"
              >
                <p className="text-sm font-medium text-neutral-100">
                  {section.title}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {section.description}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-neutral-500">
            Settings are placeholders for now — nothing here is saved yet.
          </p>
        </div>
      </aside>
    </div>
  );
}
