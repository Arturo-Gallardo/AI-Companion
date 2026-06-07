import type { ReactNode } from "react";

interface IconButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "neutral" | "danger";
  children: ReactNode;
}

function IconButton({
  label,
  onClick,
  disabled = false,
  variant = "neutral",
  children,
}: IconButtonProps) {
  const variantClass =
    variant === "danger"
      ? "text-red-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 disabled:hover:border-neutral-800 disabled:hover:bg-transparent disabled:hover:text-neutral-600"
      : "text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white disabled:hover:border-neutral-800 disabled:hover:bg-transparent disabled:hover:text-neutral-600";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 transition disabled:cursor-not-allowed disabled:opacity-40 ${variantClass}`}
    >
      {children}
    </button>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M4 10l4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M3.5 4.5h9M6 4.5V3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6.5 7v4M9.5 7v4M4.5 4.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FrameOrderListProps {
  frames: string[];
  urlFor: (path: string) => string;
  nameFor: (path: string) => string;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}

export function FrameOrderList({
  frames,
  urlFor,
  nameFor,
  onMove,
  onRemove,
}: FrameOrderListProps) {
  if (frames.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 px-3 py-4 text-center text-xs text-neutral-500">
        No frames yet — click sprites on the left to add them.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {frames.map((path, index) => {
        const isFirst = index === 0;
        const isLast = index === frames.length - 1;

        return (
          <li
            key={`${path}-${index}`}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-2 py-1.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-300">
              {index + 1}
            </span>
            <img
              src={urlFor(path)}
              alt=""
              className="h-8 w-8 shrink-0 rounded border border-neutral-800 bg-neutral-950 object-contain p-0.5"
              style={{ imageRendering: "pixelated" }}
            />
            <span
              className="min-w-0 flex-1 truncate text-[11px] text-neutral-400"
              title={nameFor(path)}
            >
              {nameFor(path)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                label="Move up"
                onClick={() => onMove(index, -1)}
                disabled={isFirst}
              >
                <ChevronUpIcon />
              </IconButton>
              <IconButton
                label="Move down"
                onClick={() => onMove(index, 1)}
                disabled={isLast}
              >
                <ChevronDownIcon />
              </IconButton>
              <IconButton
                label="Remove frame"
                variant="danger"
                onClick={() => onRemove(index)}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
