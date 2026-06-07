import type { ReactNode } from "react";

interface TomojiPageHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
}

export function TomojiPageHeader({
  title,
  onBack,
  backLabel = "Back",
  trailing,
}: TomojiPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
          >
            {backLabel}
          </button>
        ) : null}
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {trailing ? <div className="ml-auto shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
