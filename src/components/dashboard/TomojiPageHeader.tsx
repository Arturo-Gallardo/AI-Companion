import type { ReactNode } from "react";

interface TomojiPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
}

export function TomojiPageHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Back",
  trailing,
}: TomojiPageHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
        >
          {backLabel}
        </button>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle ? (
          <p className="text-xs text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="ml-auto shrink-0">{trailing}</div> : null}
    </div>
  );
}
