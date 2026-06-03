import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showCompanionMenu } from "../services/companionMenuApi";
import type { CompanionAction, FacingDirection } from "../animations/types";
import { LANDING_THRESHOLD } from "../animations/beyondBirthday";
import {
  type CompanionBehaviorState,
  type FallVelocity,
  type ScreenPosition,
} from "../types/companion";
import { hitTitleBarAt } from "../services/companionApi";
import { getDialogueDisplayMs } from "../utils/dialogueDuration";
import { useCompanionDrag } from "./useCompanionDrag";
import { useCompanionFall } from "./useCompanionFall";
import { useCompanionMovement } from "./useCompanionMovement";

const MIN_IDLE_MS = 3000;
const MAX_IDLE_MS = 8000;
const MIN_WALK_DISTANCE = 80;

// shimeji-style floor idle: sometimes sit instead of walking
const AUTONOMOUS_SIT_CHANCE = 0.32;
const MIN_AUTONOMOUS_SIT_MS = 20000;
const MAX_AUTONOMOUS_SIT_MS = 55000;
const TITLE_BAR_HOVER_PROBE_MS = 50;

type SittingMode = "manual" | "auto" | null;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomIdleDelay(): number {
  return randomBetween(MIN_IDLE_MS, MAX_IDLE_MS);
}

interface UseCompanionBehaviorResult {
  action: CompanionAction;
  facing: FacingDirection;
  behaviorState: CompanionBehaviorState;
  dialogueText: string | null;
  isReady: boolean;
  showTitleBarLockHint: boolean;
  grabbedLeanFrame: string;
  getAnchorPosition: () => ScreenPosition;
  onWalkTick: (deltaX: number) => void;
  onBounceComplete: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  startDialogue: (text: string) => void;
  dismissDialogue: () => void;
  toggleSit: () => void;
  turnAround: () => void;
  walkToAnchorX: (screenX: number) => void;
  canOpenContextMenu: boolean;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
}

export function useCompanionBehavior(): UseCompanionBehaviorResult {
  const handleSurfaceLockLostRef = useRef<() => void>(() => {});

  const {
    anchorX,
    isReady,
    moveBy,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls,
    getFloorYAt,
    getAnchorPosition,
    getHorizontalWalkRange,
    clearSurfaceLock,
    tryLockSurfaceAt,
  } = useCompanionMovement({
    onSurfaceLockLost: () => {
      handleSurfaceLockLostRef.current();
    },
  });

  const [behaviorState, setBehaviorState] =
    useState<CompanionBehaviorState>("idle");
  const [action, setAction] = useState<CompanionAction>("idle");
  const [facing, setFacing] = useState<FacingDirection>("left");
  const [fallVelocity, setFallVelocity] = useState<FallVelocity>({
    x: 0,
    y: 0,
  });
  const [skipResistOnGrab, setSkipResistOnGrab] = useState(false);
  const [dialogueText, setDialogueText] = useState<string | null>(null);
  const [showTitleBarLockHint, setShowTitleBarLockHint] = useState(false);

  const targetXRef = useRef<number | null>(null);
  const titleBarHoverProbeRef = useRef<number | null>(null);
  const anchorXRef = useRef(anchorX);
  const isDraggingRef = useRef(false);
  const behaviorStateRef = useRef(behaviorState);
  const dialogueReturnStateRef = useRef<"idle" | "sitting">("idle");
  const sittingModeRef = useRef<SittingMode>(null);

  useEffect(() => {
    anchorXRef.current = anchorX;
  }, [anchorX]);

  useEffect(() => {
    behaviorStateRef.current = behaviorState;
  }, [behaviorState]);

  const startBounce = useCallback(() => {
    setBehaviorState("bouncing");
    setAction("bounce");
  }, []);

  const returnToIdle = useCallback(() => {
    targetXRef.current = null;
    isDraggingRef.current = false;
    sittingModeRef.current = null;
    setSkipResistOnGrab(false);
    setDialogueText(null);
    setBehaviorState("idle");
    setAction("idle");
  }, []);

  const startDialogue = useCallback((text: string) => {
    const currentState = behaviorStateRef.current;
    if (
      currentState !== "idle" &&
      currentState !== "walking" &&
      currentState !== "sitting" &&
      currentState !== "dialoguing"
    ) {
      return;
    }

    if (currentState !== "dialoguing") {
      dialogueReturnStateRef.current =
        currentState === "sitting" ? "sitting" : "idle";

      // dialogue during an auto-sit should not snap back into a timed auto-sit
      if (currentState === "sitting" && sittingModeRef.current === "auto") {
        sittingModeRef.current = "manual";
      }
    }

    // clears any in-progress walk target so movement stops immediately
    targetXRef.current = null;
    setDialogueText(text);
    setBehaviorState("dialoguing");
    setAction(
      dialogueReturnStateRef.current === "sitting" ? "sit" : "idle",
    );
  }, []);

  const dismissDialogue = useCallback(() => {
    if (behaviorStateRef.current !== "dialoguing") {
      return;
    }

    setDialogueText(null);

    if (dialogueReturnStateRef.current === "sitting") {
      setBehaviorState("sitting");
      setAction("sit");
      return;
    }

    setBehaviorState("idle");
    setAction("idle");
  }, []);

  const startSitting = useCallback((mode: "manual" | "auto") => {
    targetXRef.current = null;
    setDialogueText(null);
    sittingModeRef.current = mode;
    setBehaviorState("sitting");
    setAction("sit");
  }, []);

  const toggleSit = useCallback(() => {
    const currentState = behaviorStateRef.current;

    if (currentState === "sitting") {
      returnToIdle();
      return;
    }

    if (
      currentState !== "idle" &&
      currentState !== "walking" &&
      currentState !== "dialoguing"
    ) {
      return;
    }

    startSitting("manual");
  }, [returnToIdle, startSitting]);

  useEffect(() => {
    if (behaviorState !== "dialoguing" || dialogueText === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissDialogue();
    }, getDialogueDisplayMs(dialogueText));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [behaviorState, dialogueText, dismissDialogue]);

  const handleSurfaceLockLost = useCallback(() => {
    const currentState = behaviorStateRef.current;
    if (
      currentState === "dragging" ||
      currentState === "falling" ||
      currentState === "bouncing"
    ) {
      return;
    }

    targetXRef.current = null;
    setFallVelocity({ x: 0, y: 2 });
    setBehaviorState("falling");
    setAction("fall");
  }, []);

  useEffect(() => {
    handleSurfaceLockLostRef.current = handleSurfaceLockLost;
  }, [handleSurfaceLockLost]);

  const clearTitleBarHoverProbe = useCallback(() => {
    if (titleBarHoverProbeRef.current !== null) {
      window.clearTimeout(titleBarHoverProbeRef.current);
      titleBarHoverProbeRef.current = null;
    }
  }, []);

  const clearTitleBarLockHint = useCallback(() => {
    clearTitleBarHoverProbe();
    setShowTitleBarLockHint(false);
  }, [clearTitleBarHoverProbe]);

  const handleDragMove = useCallback(
    (anchor: ScreenPosition) => {
      clearTitleBarHoverProbe();

      titleBarHoverProbeRef.current = window.setTimeout(() => {
        titleBarHoverProbeRef.current = null;

        void hitTitleBarAt(anchor.x, anchor.y).then((surface) => {
          setShowTitleBarLockHint(surface !== null);
        });
      }, TITLE_BAR_HOVER_PROBE_MS);
    },
    [clearTitleBarHoverProbe],
  );

  useEffect(() => {
    return () => {
      clearTitleBarHoverProbe();
    };
  }, [clearTitleBarHoverProbe]);

  const handleDragStart = useCallback(() => {
    const currentState = behaviorStateRef.current;
    const wasFalling = currentState === "falling";

    targetXRef.current = null;
    isDraggingRef.current = true;
    clearSurfaceLock();
    clearTitleBarLockHint();
    setDialogueText(null);

    if (wasFalling) {
      setFallVelocity({ x: 0, y: 0 });
      setSkipResistOnGrab(true);
      setBehaviorState("dragging");
      setAction("grabbed");
      return;
    }

    setSkipResistOnGrab(false);
    setBehaviorState("dragging");
    setAction("resist");
  }, [clearSurfaceLock, clearTitleBarLockHint]);

  const handleResistEnd = useCallback(() => {
    if (!isDraggingRef.current) {
      return;
    }

    setAction("grabbed");
  }, []);

  const handleDragEnd = useCallback(
    ({
      throwVelocity: releaseVelocity,
      anchor,
    }: {
      throwVelocity: FallVelocity;
      anchor: { x: number; y: number };
    }) => {
      isDraggingRef.current = false;
      setSkipResistOnGrab(false);
      clearTitleBarLockHint();

      void (async () => {
        const lockedSurface = await tryLockSurfaceAt(anchor.x, anchor.y);

        if (lockedSurface) {
          await setAnchorPosition(
            { x: clampAnchorX(anchor.x), y: lockedSurface.top },
            "grounded",
          );
          startBounce();
          return;
        }

        const floorY = getFloorYAt(anchor.x, anchor.y);

        if (anchor.y >= floorY - LANDING_THRESHOLD) {
          await setAnchorPosition({ x: anchor.x, y: floorY }, "grounded");
          startBounce();
          return;
        }

        setFallVelocity(releaseVelocity);
        setBehaviorState("falling");
        setAction("fall");
      })();
    },
    [
      clampAnchorX,
      clearTitleBarLockHint,
      getFloorYAt,
      setAnchorPosition,
      startBounce,
      tryLockSurfaceAt,
    ],
  );

  const dragEnabled =
    isReady &&
    (behaviorState === "idle" ||
      behaviorState === "walking" ||
      behaviorState === "sitting" ||
      behaviorState === "dialoguing" ||
      behaviorState === "falling");

  const { grabbedLeanFrame, onPointerDown } = useCompanionDrag({
    isEnabled: dragEnabled,
    skipResistDelay: skipResistOnGrab,
    getAnchorPosition,
    setAnchorPosition,
    onDragStart: handleDragStart,
    onResistEnd: handleResistEnd,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  });

  useCompanionFall({
    isActive: behaviorState === "falling",
    initialVelocity: fallVelocity,
    getFloorYAt,
    clampToWalls,
    getAnchorPosition,
    onPositionChange: (position) => {
      void setAnchorPosition(position, "walls");
    },
    onLand: () => {
      const anchor = getAnchorPosition();
      const floorY = getFloorYAt(anchor.x, anchor.y);

      startBounce();
      void setAnchorPosition({ x: anchor.x, y: floorY }, "grounded");
    },
  });

  const startWalkingTo = useCallback((targetX: number) => {
    const currentX = anchorXRef.current;
    const direction: FacingDirection = targetX >= currentX ? "right" : "left";

    sittingModeRef.current = null;
    targetXRef.current = targetX;
    setFacing(direction);
    setBehaviorState("walking");
    setAction("walk");
  }, []);

  const turnAround = useCallback(() => {
    const currentState = behaviorStateRef.current;
    if (
      currentState === "walking" ||
      currentState === "dragging" ||
      currentState === "falling" ||
      currentState === "bouncing"
    ) {
      return;
    }

    setFacing((current) => (current === "left" ? "right" : "left"));
  }, []);

  const walkToAnchorX = useCallback(
    (screenX: number) => {
      const currentState = behaviorStateRef.current;
      if (
        currentState === "dragging" ||
        currentState === "falling" ||
        currentState === "bouncing"
      ) {
        return;
      }

      if (currentState === "dialoguing") {
        setDialogueText(null);
      }

      const targetX = clampAnchorX(screenX);
      startWalkingTo(targetX);
    },
    [clampAnchorX, startWalkingTo],
  );

  const pickWalkTarget = useCallback(() => {
    const range = getHorizontalWalkRange();
    if (!range) {
      return null;
    }

    const { minX, maxX } = range;
    let nextTarget = clampAnchorX(randomBetween(minX, maxX));

    if (Math.abs(nextTarget - anchorXRef.current) < MIN_WALK_DISTANCE) {
      const alternate = nextTarget > anchorXRef.current ? minX : maxX;
      nextTarget = clampAnchorX(alternate);
    }

    if (Math.abs(nextTarget - anchorXRef.current) < MIN_WALK_DISTANCE) {
      return null;
    }

    return nextTarget;
  }, [clampAnchorX, getHorizontalWalkRange]);

  useEffect(() => {
    if (!isReady || behaviorState !== "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (behaviorStateRef.current !== "idle") {
        return;
      }

      if (Math.random() < AUTONOMOUS_SIT_CHANCE) {
        startSitting("auto");
        return;
      }

      const target = pickWalkTarget();
      if (target === null) {
        return;
      }

      startWalkingTo(target);
    }, randomIdleDelay());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [behaviorState, isReady, pickWalkTarget, startSitting, startWalkingTo]);

  // auto sit eventually stands back up; manual sit stays until the user toggles it
  useEffect(() => {
    if (behaviorState !== "sitting" || sittingModeRef.current !== "auto") {
      return;
    }

    const sitDurationMs = randomBetween(
      MIN_AUTONOMOUS_SIT_MS,
      MAX_AUTONOMOUS_SIT_MS,
    );

    const timeoutId = window.setTimeout(() => {
      if (
        behaviorStateRef.current === "sitting" &&
        sittingModeRef.current === "auto"
      ) {
        returnToIdle();
      }
    }, sitDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [behaviorState, returnToIdle]);

  const finishWalking = useCallback(
    async (targetX: number) => {
      targetXRef.current = null;
      await setAnchorX(targetX);
      setBehaviorState("idle");
      setAction("idle");
    },
    [setAnchorX],
  );

  const onWalkTick = useCallback(
    (deltaX: number) => {
      if (behaviorState !== "walking" || targetXRef.current === null) {
        return;
      }

      const currentX = anchorXRef.current;
      const targetX = targetXRef.current;
      const nextX = currentX + deltaX;
      const reachedTarget =
        (facing === "right" && nextX >= targetX) ||
        (facing === "left" && nextX <= targetX);

      if (reachedTarget) {
        void finishWalking(clampAnchorX(targetX));
        return;
      }

      const moved = moveBy(deltaX);
      if (!moved) {
        void finishWalking(clampAnchorX(currentX));
      }
    },
    [behaviorState, clampAnchorX, facing, finishWalking, moveBy],
  );

  const onBounceComplete = useCallback(() => {
    if (behaviorState !== "bouncing") {
      return;
    }

    returnToIdle();
  }, [behaviorState, returnToIdle]);

  const canOpenContextMenu = useMemo(
    () =>
      isReady &&
      (behaviorState === "idle" ||
        behaviorState === "walking" ||
        behaviorState === "sitting" ||
        behaviorState === "dialoguing" ||
        behaviorState === "falling"),
    [behaviorState, isReady],
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();

      if (!canOpenContextMenu) {
        return;
      }

      void showCompanionMenu(event.screenX, event.screenY);
    },
    [canOpenContextMenu],
  );

  return {
    action,
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
    canOpenContextMenu,
    onContextMenu,
  };
}
