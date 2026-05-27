import { SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionBehavior } from "../../hooks/useCompanionBehavior";
import { useCompanionDialogueEvents } from "../../hooks/useCompanionDialogueEvents";
import { useCompanionMirrorBroadcast } from "../../hooks/useCompanionMirrorBroadcast";
import { COMPANION_WINDOW_HEIGHT } from "../../types/companion";
import { CompanionSpeechBubble } from "./CompanionSpeechBubble";
import { CompanionSprite } from "./CompanionSprite";

export function CompanionWindow() {
  const {
    action,
    facing,
    behaviorState,
    dialogueText,
    isReady,
    grabbedLeanFrame,
    onWalkTick,
    onBounceComplete,
    onPointerDown,
    startDialogue,
    dismissDialogue,
  } = useCompanionBehavior();

  useCompanionDialogueEvents({ startDialogue, dismissDialogue });

  const { frameSrc } = useCompanionAnimation({
    action,
    facing,
    grabbedLeanFrame,
    onTick: onWalkTick,
    onBounceComplete,
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
      className="flex flex-col items-center justify-end bg-transparent"
      style={{ width: SPRITE_WIDTH, height: COMPANION_WINDOW_HEIGHT }}
    >
      {dialogueText !== null ? (
        <div className="mb-1 flex w-full justify-center px-1">
          <CompanionSpeechBubble text={dialogueText} />
        </div>
      ) : null}

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
