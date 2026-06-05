interface AddTomojiCardProps {
  onAdd: () => void;
}

export function AddTomojiCard({ onAdd }: AddTomojiCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative h-36 w-36 rounded-2xl border border-white bg-neutral-950 hover:bg-neutral-900"
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
