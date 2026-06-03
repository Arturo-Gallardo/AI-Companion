import {
  getSpriteAnchorForAction,
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
} from "../../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../../animations/types";
import type { WindowWallSide } from "../../types/companion";

interface CompanionSpriteProps {
  frameSrc: string;
  facing: FacingDirection;
  action: CompanionAction;
  wallSide?: WindowWallSide | null;
  isDragging?: boolean;
  interactive?: boolean;
  scale?: number;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLElement>) => void;
}

function shouldFlipSprite(
  action: CompanionAction,
  facing: FacingDirection,
  wallSide: WindowWallSide | null | undefined,
): boolean {
  if (
    action === "grabWall" ||
    action === "climbWall" ||
    action === "climbWallDown"
  ) {
    return wallSide === "left";
  }

  if (
    action !== "idle" &&
    action !== "walk" &&
    action !== "sit" &&
    action !== "sitOnBar" &&
    action !== "dangleOnBar" &&
    action !== "grabCeiling" &&
    action !== "climbCeiling"
  ) {
    return false;
  }

  return facing === "right";
}

export function CompanionSprite({
  frameSrc,
  facing,
  action,
  wallSide = null,
  isDragging = false,
  interactive = true,
  scale = 1,
  onPointerDown,
  onContextMenu,
}: CompanionSpriteProps) {
  const flipScale = shouldFlipSprite(action, facing, wallSide) ? -1 : 1;
  const spriteAnchor = getSpriteAnchorForAction(action);
  const width = SPRITE_WIDTH * scale;
  const height = SPRITE_HEIGHT * scale;

  return (
    <div
      className="relative overflow-visible"
      style={{ width, height }}
    >
      <img
        src={frameSrc}
        alt="Tomoji companion"
        draggable={false}
        onPointerDown={interactive ? onPointerDown : undefined}
        onContextMenu={interactive ? onContextMenu : undefined}
        className="absolute left-0 top-0 max-w-none touch-none select-none"
        style={{
          width,
          height,
          cursor: interactive ? (isDragging ? "grabbing" : "grab") : "default",
          transform: `scaleX(${flipScale})`,
          transformOrigin: `${spriteAnchor.x * scale}px ${spriteAnchor.y * scale}px`,
        }}
      />
    </div>
  );
}
