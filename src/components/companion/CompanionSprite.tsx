import { SPRITE_ANCHOR, SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../../animations/types";

interface CompanionSpriteProps {
  frameSrc: string;
  facing: FacingDirection;
  action: CompanionAction;
  isDragging?: boolean;
  interactive?: boolean;
  scale?: number;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
}

function shouldFlipSprite(action: CompanionAction, facing: FacingDirection): boolean {
  if (action !== "idle" && action !== "walk") {
    return false;
  }

  return facing === "right";
}

export function CompanionSprite({
  frameSrc,
  facing,
  action,
  isDragging = false,
  interactive = true,
  scale = 1,
  onPointerDown,
}: CompanionSpriteProps) {
  const flipScale = shouldFlipSprite(action, facing) ? -1 : 1;
  const width = SPRITE_WIDTH * scale;
  const height = SPRITE_HEIGHT * scale;

  return (
    <div
      className="relative overflow-visible"
      style={{ width, height }}
    >
      <img
        src={frameSrc}
        alt="Focus companion"
        draggable={false}
        onPointerDown={interactive ? onPointerDown : undefined}
        className="absolute left-0 top-0 max-w-none touch-none select-none"
        style={{
          width,
          height,
          cursor: interactive ? (isDragging ? "grabbing" : "grab") : "default",
          transform: `scaleX(${flipScale})`,
          transformOrigin: `${SPRITE_ANCHOR.x * scale}px ${SPRITE_ANCHOR.y * scale}px`,
        }}
      />
    </div>
  );
}
