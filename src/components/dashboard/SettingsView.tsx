const PLACEHOLDER_SECTIONS = [
  { title: "Companion", description: "Sprite, behavior, and overlay window options" },
  { title: "Appearance", description: "Theme, layout, and display preferences" },
  { title: "Account", description: "Profile, email, and sign-in" },
  { title: "Subscription", description: "Plan, billing, and upgrades" },
  { title: "Advanced", description: "Startup, data export, and reset options" },
] as const;

export function SettingsView() {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Settings</h1>

        <div className="mt-8 space-y-3">
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
    </section>
  );
}
