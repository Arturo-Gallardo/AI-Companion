import { SPRITE_ANCHOR, SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../../animations/types";

interface CompanionSpriteProps {
  frameSrc: string;
  facing: FacingDirection;
  action: CompanionAction;
  isDragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
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
  isDragging,
  onPointerDown,
}: CompanionSpriteProps) {
  const flipScale = shouldFlipSprite(action, facing) ? -1 : 1;

  return (
    <div
      className="relative overflow-visible"
      style={{ width: SPRITE_WIDTH, height: SPRITE_HEIGHT }}
    >
      <img
        src={frameSrc}
        alt="Focus companion"
        draggable={false}
        onPointerDown={onPointerDown}
        className="absolute left-0 top-0 max-w-none touch-none select-none"
        style={{
          width: SPRITE_WIDTH,
          height: SPRITE_HEIGHT,
          cursor: isDragging ? "grabbing" : "grab",
          transform: `scaleX(${flipScale})`,
          transformOrigin: `${SPRITE_ANCHOR.x}px ${SPRITE_ANCHOR.y}px`,
        }}
      />
    </div>
  );
}
