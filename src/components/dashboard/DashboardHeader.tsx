interface DashboardHeaderProps {
  onOpenSettings: () => void;
}

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-end gap-3 px-6 py-4">
      <button
        type="button"
        disabled
        title="Coming soon"
        className="h-8 w-8 rounded-full border-2 border-neutral-600/80 text-neutral-500"
        aria-label="Account"
      />

      <button
        type="button"
        onClick={onOpenSettings}
        className="h-8 w-8 rounded-full border-2 border-neutral-500/90 text-neutral-300 transition hover:border-neutral-400"
        aria-label="Settings"
      />
    </header>
  );
}
