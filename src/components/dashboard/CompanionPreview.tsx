import { useCharacterAnimationRegistry } from "../../hooks/useCharacterAnimationRegistry";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionMirrorState } from "../../hooks/useCompanionMirrorState";
import type { AnimationRegistry } from "../../services/animationRegistry";
import type { CompanionInstance } from "../../types/companionInstance";
import { CompanionSprite } from "../companion/CompanionSprite";

const PREVIEW_SCALE = 3;

interface CompanionPreviewProps {
  instance: CompanionInstance;
}

interface CompanionPreviewInnerProps {
  instance: CompanionInstance;
  registry: AnimationRegistry;
}

function CompanionPreviewInner({
  instance,
  registry,
}: CompanionPreviewInnerProps) {
  const mirrorState = useCompanionMirrorState(instance.id);

  const { frameSrc } = useCompanionAnimation({
    registry,
    action: mirrorState.action,
    facing: mirrorState.facing,
    grabbedLeanTier: mirrorState.grabbedLeanTier,
  });

  const previewWidth = registry.spriteWidth * PREVIEW_SCALE;
  const previewHeight = registry.spriteHeight * PREVIEW_SCALE;

  return (
    <section className="flex h-full min-h-0 items-center justify-center">
      <div
        className="flex items-center justify-center"
        style={{ width: previewWidth, height: previewHeight }}
      >
        <CompanionSprite
          frameSrc={frameSrc}
          facing={mirrorState.facing}
          action={mirrorState.action}
          isDragging={mirrorState.isDragging}
          interactive={false}
          scale={PREVIEW_SCALE}
          spriteWidth={registry.spriteWidth}
          spriteHeight={registry.spriteHeight}
          spriteAnchor={registry.getSpriteAnchor(mirrorState.action)}
        />
      </div>
    </section>
  );
}

export function CompanionPreview({ instance }: CompanionPreviewProps) {
  const registry = useCharacterAnimationRegistry(instance.characterId);

  if (registry === null) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center text-sm text-neutral-500">
        Loading preview…
      </section>
    );
  }

  return <CompanionPreviewInner instance={instance} registry={registry} />;
}
