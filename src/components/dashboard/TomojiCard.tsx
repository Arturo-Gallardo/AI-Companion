import { useState } from "react";
import { getFramePath } from "../../animations/beyondBirthday";
import type { Tomoji } from "../../types/tomoji";
import { CompanionSprite } from "../companion/CompanionSprite";

interface TomojiCardProps {
  tomoji: Tomoji;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TomojiCard({ tomoji, onDelete, onToggle }: TomojiCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = () => {
    if (tomoji.isDefault) {
      return;
    }

    onDelete(tomoji.id);
    setIsMenuOpen(false);
  };

  return (
    <article
      className={`relative flex h-36 w-36 flex-col items-center justify-between rounded-2xl border px-3 py-3 ${
        tomoji.isActive ? "border-white" : "border-neutral-500/80"
      } bg-neutral-950`}
    >
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={() => onToggle(tomoji.id)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            tomoji.isActive
              ? "bg-white text-black"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
          aria-pressed={tomoji.isActive}
        >
          {tomoji.isActive ? "On" : "Off"}
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="rounded-full px-1.5 pb-1 text-lg leading-none text-white hover:bg-neutral-800"
          aria-expanded={isMenuOpen}
          aria-label={`More options for ${tomoji.name}`}
        >
          ...
        </button>
      </div>

      <div className="flex h-[72px] items-center justify-center">
        <CompanionSprite
          frameSrc={getFramePath("shime1.png")}
          facing="left"
          action="idle"
          interactive={false}
          scale={0.64}
        />
      </div>

      <p className="w-full truncate text-center text-sm font-bold text-white">
        {tomoji.name}
      </p>

      {isMenuOpen ? (
        <div className="absolute right-2 top-9 z-10 w-36 rounded-lg border border-neutral-700 bg-neutral-950 p-1 shadow-xl">
          <button
            type="button"
            onClick={handleDelete}
            disabled={tomoji.isDefault}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-red-300 enabled:hover:bg-red-500/15 disabled:cursor-default disabled:text-neutral-500"
          >
            {tomoji.isDefault ? "Default locked" : "Delete"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
