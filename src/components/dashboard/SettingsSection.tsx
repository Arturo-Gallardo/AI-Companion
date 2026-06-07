import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children?: ReactNode;
  comingSoon?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  comingSoon = false,
}: SettingsSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-600/70 bg-neutral-900/50 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-100">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>
        {comingSoon ? (
          <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
            Soon
          </span>
        ) : null}
      </div>

      {children ? <div className="mt-4 space-y-4">{children}</div> : null}
    </section>
  );
}
