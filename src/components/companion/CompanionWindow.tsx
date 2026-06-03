import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionBackgroundEvents } from "../../hooks/useCompanionBackgroundEvents";
import { useCompanionBehavior } from "../../hooks/useCompanionBehavior";
import { useCompanionDialogueEvents } from "../../hooks/useCompanionDialogueEvents";
import { useCompanionMenuEvents } from "../../hooks/useCompanionMenuEvents";
import { useCompanionSitEvents } from "../../hooks/useCompanionSitEvents";
import { useCompanionWalkPickerEvents } from "../../hooks/useCompanionWalkPickerEvents";
import { useCompanionMirrorBroadcast } from "../../hooks/useCompanionMirrorBroadcast";
import { useCompanionSpeechWindow } from "../../hooks/useCompanionSpeechWindow";
import { CompanionSprite } from "./CompanionSprite";
import { CompanionSurfaceLockIndicator } from "./CompanionSurfaceLockIndicator";

export function CompanionWindow() {
  const {
    displayAction,
    facing,
    behaviorState,
    dialogueText,
    isReady,
    showTitleBarLockHint,
    grabbedLeanFrame,
    getAnchorPosition,
    onWalkTick,
    onBounceComplete,
    onPointerDown,
    startDialogue,
    dismissDialogue,
    toggleSit,
    turnAround,
    walkToAnchorX,
    onContextMenu,
  } = useCompanionBehavior();

  const backgroundMode = useCompanionBackgroundEvents();

  useCompanionDialogueEvents({ startDialogue, dismissDialogue });
  useCompanionSitEvents({ toggleSit });
  useCompanionMenuEvents({ onTurnAround: turnAround, onSit: toggleSit });
  useCompanionWalkPickerEvents({
    onSelectTarget: walkToAnchorX,
    onCancel: () => {},
  });

  const { frameSrc } = useCompanionAnimation({
    action: displayAction,
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
    action: displayAction,
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
      className={`relative overflow-visible ${
        backgroundMode === "gray" ? "bg-neutral-600/45" : "bg-transparent"
      }`}
      style={{ width: SPRITE_WIDTH, height: SPRITE_HEIGHT }}
    >
      <CompanionSurfaceLockIndicator
        visible={showTitleBarLockHint && behaviorState === "dragging"}
      />
      <CompanionSprite
        frameSrc={frameSrc}
        facing={facing}
        action={displayAction}
        isDragging={behaviorState === "dragging"}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
