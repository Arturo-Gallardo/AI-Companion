import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../../animations/beyondBirthday";
import { useCompanionAnimation } from "../../hooks/useCompanionAnimation";
import { useCompanionBackgroundEvents } from "../../hooks/useCompanionBackgroundEvents";
import { useCompanionBehavior } from "../../hooks/useCompanionBehavior";
import { useCompanionDialogueEvents } from "../../hooks/useCompanionDialogueEvents";
import { useCompanionFreezeEvents } from "../../hooks/useCompanionFreezeEvents";
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
    wallSide,
    behaviorState,
    dialogueText,
    isReady,
    showTitleBarLockHint,
    grabbedLeanFrame,
    getAnchorPosition,
    onWalkTick,
    onClimbTick,
    onBounceComplete,
    onPointerDown,
    startDialogue,
    dismissDialogue,
    toggleSit,
    turnAround,
    walkToAnchorX,
    crawlToAnchorX,
    climbToAnchorY,
    isFrozen,
    toggleFreeze,
    unfreeze,
    onContextMenu,
  } = useCompanionBehavior();

  const backgroundMode = useCompanionBackgroundEvents();

  useCompanionDialogueEvents({ startDialogue, dismissDialogue });
  useCompanionSitEvents({ toggleSit });
  useCompanionFreezeEvents({ toggleFreeze });
  useCompanionMenuEvents({
    onTurnAround: turnAround,
    onSit: toggleSit,
    onToggleFreeze: toggleFreeze,
    onUnfreeze: unfreeze,
  });
  useCompanionWalkPickerEvents({
    onSelectWalkTarget: walkToAnchorX,
    onSelectCrawlTarget: crawlToAnchorX,
    onSelectClimbTarget: climbToAnchorY,
    onCancel: () => {},
  });

  const { frameSrc } = useCompanionAnimation({
    action: displayAction,
    facing,
    grabbedLeanFrame,
    onTick: onWalkTick,
    onClimbTick,
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
    isFrozen,
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
        wallSide={wallSide}
        isDragging={behaviorState === "dragging"}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
