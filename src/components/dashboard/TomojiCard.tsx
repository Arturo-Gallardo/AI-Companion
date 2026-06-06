import { useState } from "react";
import { getFramePath } from "../../animations/beyondBirthday";
import { BUILTIN_CHARACTER_ID } from "../../services/characterLibrary";
import type { CompanionInstance } from "../../types/companionInstance";
import { CompanionSprite } from "../companion/CompanionSprite";

interface TomojiCardProps {
  instance: CompanionInstance;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
}

export function TomojiCard({
  instance,
  onDelete,
  onToggle,
  onEdit,
}: TomojiCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isBuiltin = instance.characterId === BUILTIN_CHARACTER_ID;

  const handleDelete = () => {
    onDelete(instance.id);
    setIsMenuOpen(false);
  };

  const handleEdit = () => {
    onEdit(instance.id);
    setIsMenuOpen(false);
  };

  return (
    <article
      className={`relative flex h-36 w-36 flex-col items-center justify-between rounded-2xl border px-3 py-3 ${
        instance.enabled ? "border-white" : "border-neutral-500/80"
      } bg-neutral-950`}
    >
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={() => onToggle(instance.id, !instance.enabled)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            instance.enabled
              ? "bg-white text-black"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
          aria-pressed={instance.enabled}
        >
          {instance.enabled ? "On" : "Off"}
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="rounded-full px-1.5 pb-1 text-lg leading-none text-white hover:bg-neutral-800"
          aria-expanded={isMenuOpen}
          aria-label={`More options for ${instance.name}`}
        >
          ...
        </button>
      </div>

      <div className="flex h-[72px] items-center justify-center">
        {isBuiltin ? (
          <CompanionSprite
            frameSrc={getFramePath("shime1.png")}
            facing="left"
            action="idle"
            interactive={false}
            scale={0.64}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800 text-lg font-bold text-neutral-300">
            {instance.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <p className="w-full truncate text-center text-sm font-bold text-white">
        {instance.name}
      </p>

      {isMenuOpen ? (
        <div className="absolute right-2 top-9 z-10 w-36 rounded-lg border border-neutral-700 bg-neutral-950 p-1 shadow-xl">
          <button
            type="button"
            onClick={handleEdit}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-neutral-200 hover:bg-neutral-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-red-300 hover:bg-red-500/15"
          >
            Delete
          </button>
        </div>
      ) : null}
    </article>
  );
}
