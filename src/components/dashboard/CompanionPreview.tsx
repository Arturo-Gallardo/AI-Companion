import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionMirrorState } from "../../hooks/useCompanionMirrorState";
import { CompanionSprite } from "../companion/CompanionSprite";

const PREVIEW_SCALE = 3;

export function CompanionPreview() {
  const mirrorState = useCompanionMirrorState();

  const { frameSrc } = useCompanionAnimation({
    action: mirrorState.action,
    facing: mirrorState.facing,
    grabbedLeanFrame: mirrorState.grabbedLeanFrame,
  });

  const previewWidth = SPRITE_WIDTH * PREVIEW_SCALE;
  const previewHeight = SPRITE_HEIGHT * PREVIEW_SCALE;

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
        />
      </div>
    </section>
  );
}
