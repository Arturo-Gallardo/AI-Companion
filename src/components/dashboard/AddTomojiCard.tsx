interface AddTomojiCardProps {
  onAdd: () => void;
}

export function AddTomojiCard({ onAdd }: AddTomojiCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative aspect-square w-full max-w-[11rem] rounded-2xl border border-dashed border-neutral-600 bg-neutral-950 transition hover:border-white hover:bg-neutral-900"
      aria-label="Add Tomoji"
    >
      <span
        className="absolute left-1/2 top-1/2 h-14 w-[1.5px] -translate-x-1/2 -translate-y-1/2 bg-white"
        aria-hidden
      />
      <span
        className="absolute left-1/2 top-1/2 h-[1.5px] w-14 -translate-x-1/2 -translate-y-1/2 bg-white"
        aria-hidden
      />
    </button>
  );
}
