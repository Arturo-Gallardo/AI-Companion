import { useState } from "react";
import { useCharacterAnimationRegistry } from "../../hooks/useCharacterAnimationRegistry";
import type { AnimationRegistry } from "../../services/animationRegistry";
import type { CompanionInstance } from "../../types/companionInstance";
import { CompanionSprite } from "../companion/CompanionSprite";

const CARD_SPRITE_HEIGHT = 72;

interface TomojiCardProps {
  instance: CompanionInstance;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
}

interface TomojiCardSpriteProps {
  registry: AnimationRegistry;
}

function TomojiCardSprite({ registry }: TomojiCardSpriteProps) {
  const idleFrame = registry.getAnimation("idle").frames[0];
  const scale = CARD_SPRITE_HEIGHT / registry.spriteHeight;

  return (
    <CompanionSprite
      frameSrc={idleFrame}
      facing="left"
      action="idle"
      interactive={false}
      scale={scale}
      spriteWidth={registry.spriteWidth}
      spriteHeight={registry.spriteHeight}
      spriteAnchor={registry.getSpriteAnchor("idle")}
    />
  );
}

function TomojiCardSpriteLoader({ characterId }: { characterId: string }) {
  const registry = useCharacterAnimationRegistry(characterId);

  if (!registry) {
    return (
      <div
        className="rounded-lg bg-neutral-800/80 animate-pulse"
        style={{ width: CARD_SPRITE_HEIGHT * 0.75, height: CARD_SPRITE_HEIGHT * 0.75 }}
        aria-hidden
      />
    );
  }

  return <TomojiCardSprite registry={registry} />;
}

export function TomojiCard({
  instance,
  onDelete,
  onToggle,
  onEdit,
}: TomojiCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      className={`relative flex aspect-square w-full max-w-[11rem] flex-col items-center justify-between rounded-2xl border px-4 py-4 ${
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
        <TomojiCardSpriteLoader characterId={instance.characterId} />
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
