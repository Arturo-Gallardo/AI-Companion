interface CompanionSurfaceLockIndicatorProps {
  visible: boolean;
}

export function CompanionSurfaceLockIndicator({
  visible,
}: CompanionSurfaceLockIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute right-1 top-1 z-10 flex items-center gap-1 rounded-full border border-white/35 bg-black/85 px-1.5 py-0.5 shadow-sm"
      title="Release to attach to this title bar"
      aria-label="Release to attach to this title bar"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
      <span className="text-[9px] font-semibold leading-none tracking-wide text-white">
        snap
      </span>
    </div>
  );
}
