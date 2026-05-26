const PLACEHOLDER_OPTIONS = [
  { id: "option-1", label: "Option 1" },
  { id: "option-2", label: "Option 2" },
  { id: "option-3", label: "Option 3" },
  { id: "option-4", label: "Option 4" },
] as const;

export function DashboardOptionsPanel() {
  return (
    <section className="flex h-full min-h-0 items-center justify-center p-8">
      <div className="flex h-full w-full max-w-sm flex-col rounded-lg border-2 border-neutral-600/80 p-6">
        <div className="flex flex-1 flex-col justify-evenly gap-4">
          {PLACEHOLDER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled
              className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 disabled:cursor-default"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
