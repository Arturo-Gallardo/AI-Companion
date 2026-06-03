import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionBackgroundEvents } from "../../hooks/useCompanionBackgroundEvents";
import { useCompanionBehavior } from "../../hooks/useCompanionBehavior";
import { useCompanionDialogueEvents } from "../../hooks/useCompanionDialogueEvents";
import { useCompanionMirrorBroadcast } from "../../hooks/useCompanionMirrorBroadcast";
import { useCompanionSpeechWindow } from "../../hooks/useCompanionSpeechWindow";
import { CompanionSprite } from "./CompanionSprite";

export function CompanionWindow() {
  const {
    action,
    facing,
    behaviorState,
    dialogueText,
    isReady,
    grabbedLeanFrame,
    getAnchorPosition,
    onWalkTick,
    onBounceComplete,
    onPointerDown,
    startDialogue,
    dismissDialogue,
  } = useCompanionBehavior();

  const backgroundMode = useCompanionBackgroundEvents();

  useCompanionDialogueEvents({ startDialogue, dismissDialogue });

  const { frameSrc } = useCompanionAnimation({
    action,
    facing,
    grabbedLeanFrame,
    onTick: onWalkTick,
    onBounceComplete,
  });

  useCompanionSpeechWindow({
    dialogueText,
    getAnchorPosition,
    isReady,
  });

  useCompanionMirrorBroadcast({
    action,
    facing,
    grabbedLeanFrame,
    isDragging: behaviorState === "dragging",
    behaviorState,
    dialogueText,
  });

  if (!isReady) {
    return null;
  }

  return (
    <div
      className={
        backgroundMode === "gray" ? "bg-neutral-600/45" : "bg-transparent"
      }
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
