import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionBehavior } from "../../hooks/useCompanionBehavior";
import { CompanionSprite } from "./CompanionSprite";

export function CompanionWindow() {
  const {
    action,
    facing,
    behaviorState,
    isReady,
    grabbedVelocityX,
    onWalkTick,
    onBounceComplete,
    onPointerDown,
  } = useCompanionBehavior();

  const { frameSrc } = useCompanionAnimation({
    action,
    facing,
    grabbedVelocityX,
    onTick: onWalkTick,
    onBounceComplete,
  });

  if (!isReady) {
    return null;
  }

  return (
    <div
      className="bg-transparent"
      style={{ width: SPRITE_WIDTH, height: SPRITE_HEIGHT }}
    >
      <CompanionSprite
        frameSrc={frameSrc}
        facing={facing}
        action={action}
        isDragging={behaviorState === "dragging"}
        onPointerDown={onPointerDown}
      />
    </div>
  );
}
