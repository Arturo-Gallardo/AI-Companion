import type { DashboardTab } from "../../types/dashboard";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

type NavItemProps = {
  label: string;
  tab: DashboardTab;
  activeTab: DashboardTab;
  disabled?: boolean;
  onTabChange: (tab: DashboardTab) => void;
};

function NavItem({
  label,
  tab,
  activeTab,
  disabled = false,
  onTabChange,
}: NavItemProps) {
  const isActive = activeTab === tab;
  const baseClass =
    "relative pb-1 text-base font-bold text-white transition-opacity";

  if (disabled) {
    return (
      <span className={`${baseClass} cursor-default opacity-60`} aria-disabled="true">
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onTabChange(tab)}
      className={`${baseClass} hover:opacity-90`}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
      {isActive ? (
        <span
          className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-white"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function DashboardHeader({ activeTab, onTabChange }: DashboardHeaderProps) {
  return (
    <header className="shrink-0 bg-black">
      <div className="relative flex items-center justify-center px-6 py-4">
        <nav className="flex items-center gap-20" aria-label="Main">
          <NavItem
            label="Tomojis"
            tab="tomojis"
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <NavItem
            label="Dashboard"
            tab="dashboard"
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <NavItem
            label="Settings"
            tab="settings"
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </nav>

        <div className="absolute right-6 flex items-center gap-3">
          <span className="text-sm font-bold text-white">Account name</span>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="h-8 w-8 shrink-0 rounded-full border-2 border-white"
            aria-label="Account"
          />
        </div>
      </div>

      <div className="h-px w-full bg-white" aria-hidden />
    </header>
  );
}
