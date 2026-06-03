import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showCompanionMenu } from "../services/companionMenuApi";
import type { CompanionAction, FacingDirection } from "../animations/types";
import { LANDING_THRESHOLD, resolveDisplayAction, usesTitleBarSitAnchor } from "../animations/beyondBirthday";
import {
  type CompanionBehaviorState,
  type FallVelocity,
  type ScreenPosition,
  type SurfaceLock,
} from "../types/companion";
import {
  hitTitleBarAt,
  hitWindowBottomAt,
  hitWindowWallAt,
} from "../services/companionApi";
import { DIALOGUE_DISPLAY_MS } from "../utils/dialogueDuration";
import { hitScreenEdgeWallAt, isScreenEdgeHwnd } from "../utils/screenEdgeWalls";
import { useCompanionDrag } from "./useCompanionDrag";
import { useAutonomousDialogue } from "./useAutonomousDialogue";
import { useCompanionFall } from "./useCompanionFall";
import type { WindowWallSide } from "../types/companion";
import { isTitleBarLock, isWallLock, wallSideFromLock } from "../utils/windowSurfaces";
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
  displayAction: CompanionAction;
  facing: FacingDirection;
  behaviorState: CompanionBehaviorState;
  dialogueText: string | null;
  isReady: boolean;
  showTitleBarLockHint: boolean;
  wallSide: WindowWallSide | null;
  grabbedLeanFrame: string;
  getAnchorPosition: () => ScreenPosition;
  onWalkTick: (deltaX: number) => void;
  onClimbTick: (deltaY: number) => void;
  onBounceComplete: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  startDialogue: (text: string) => void;
  dismissDialogue: () => void;
  toggleSit: () => void;
  turnAround: () => void;
  walkToAnchorX: (screenX: number) => void;
  crawlToAnchorX: (screenX: number) => void;
  climbToAnchorY: (screenY: number) => void;
  isFrozen: boolean;
  toggleFreeze: () => void;
  unfreeze: () => void;
  canOpenContextMenu: boolean;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
}

export function useCompanionBehavior(): UseCompanionBehaviorResult {
  const handleSurfaceLockLostRef = useRef<() => void>(() => {});
  const usesTitleBarSitAnchorRef = useRef(false);

  const {
    anchorX,
    anchorY,
    desktopBounds,
    isReady,
    surfaceLock,
    isWallLocked,
    isUndersideLocked,
    moveBy,
    moveByY,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls,
    getFloorYAt,
    getAnchorPosition,
    getHorizontalWalkRange,
    getVerticalClimbRange,
    clearSurfaceLock,
    tryLockSurfaceAt,
  } = useCompanionMovement({
    onSurfaceLockLost: () => {
      handleSurfaceLockLostRef.current();
    },
    usesTitleBarSitAnchorRef,
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
  const [isFrozen, setIsFrozen] = useState(false);

  const targetXRef = useRef<number | null>(null);
  const targetYRef = useRef<number | null>(null);
  const titleBarHoverProbeRef = useRef<number | null>(null);
  const anchorXRef = useRef(anchorX);
  const anchorYRef = useRef(anchorY);
  const isDraggingRef = useRef(false);
  const behaviorStateRef = useRef(behaviorState);
  const dialogueReturnStateRef = useRef<"idle" | "sitting">("idle");
  const sittingModeRef = useRef<SittingMode>(null);

  const isWallLockedRef = useRef(isWallLocked);
  const isUndersideLockedRef = useRef(isUndersideLocked);
  const isFrozenRef = useRef(isFrozen);

  useEffect(() => {
    isWallLockedRef.current = isWallLocked;
  }, [isWallLocked]);

  useEffect(() => {
    isUndersideLockedRef.current = isUndersideLocked;
  }, [isUndersideLocked]);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);

  const unfreeze = useCallback(() => {
    isFrozenRef.current = false;
    setIsFrozen(false);
  }, []);

  useEffect(() => {
    anchorXRef.current = anchorX;
  }, [anchorX]);

  useEffect(() => {
    anchorYRef.current = anchorY;
  }, [anchorY]);

  useEffect(() => {
    behaviorStateRef.current = behaviorState;
  }, [behaviorState]);

  const displayAction = useMemo(
    () => resolveDisplayAction(action, surfaceLock),
    [action, surfaceLock],
  );

  const wallSide = useMemo((): WindowWallSide | null => {
    if (!surfaceLock) {
      return null;
    }

    const side = wallSideFromLock(surfaceLock.kind);
    if (!side) {
      return null;
    }

    // inset desktop anchors flip the cling pose vs window walls
    if (isScreenEdgeHwnd(surfaceLock.hwnd)) {
      return side === "left" ? "right" : "left";
    }

    return side;
  }, [surfaceLock]);

  usesTitleBarSitAnchorRef.current =
    surfaceLock !== null &&
    isTitleBarLock(surfaceLock.kind) &&
    usesTitleBarSitAnchor(displayAction);

  // reclamp Y when switching between standing on the bar vs dangling sit pose
  useEffect(() => {
    if (!isReady || !surfaceLock || !isTitleBarLock(surfaceLock.kind)) {
      return;
    }

    const anchor = getAnchorPosition();
    void setAnchorPosition(anchor, "grounded");
  }, [displayAction, getAnchorPosition, isReady, setAnchorPosition, surfaceLock]);

  const startBounce = useCallback(() => {
    setBehaviorState("bouncing");
    setAction("bounce");
  }, []);

  const returnToIdle = useCallback(() => {
    targetXRef.current = null;
    targetYRef.current = null;
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
      currentState !== "climbing" &&
      currentState !== "sitting" &&
      currentState !== "dialoguing"
    ) {
      return;
    }

    unfreeze();

    if (currentState !== "dialoguing") {
      dialogueReturnStateRef.current =
        currentState === "sitting" ? "sitting" : "idle";

      // dialogue during an auto-sit should not snap back into a timed auto-sit
      if (currentState === "sitting" && sittingModeRef.current === "auto") {
        sittingModeRef.current = "manual";
      }
    }

    // clears any in-progress walk/climb targets so movement stops immediately
    targetXRef.current = null;
    targetYRef.current = null;
    setDialogueText(text);
    setBehaviorState("dialoguing");
    setAction(
      dialogueReturnStateRef.current === "sitting" ? "sit" : "idle",
    );
  }, [unfreeze]);

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
      unfreeze();
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

    unfreeze();
    startSitting("manual");
  }, [returnToIdle, startSitting, unfreeze]);

  useEffect(() => {
    if (behaviorState !== "dialoguing" || dialogueText === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissDialogue();
    }, DIALOGUE_DISPLAY_MS);

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

  const lockToWallAndIdle = useCallback(
    async (lock: SurfaceLock) => {
      targetXRef.current = null;
      targetYRef.current = null;
      const anchor = getAnchorPosition();
      await setAnchorPosition(anchor, "locked");

      if (isScreenEdgeHwnd(lock.hwnd)) {
        setFacing(lock.kind === "wallLeft" ? "left" : "right");
      } else {
        setFacing(lock.kind === "wallLeft" ? "right" : "left");
      }

      setBehaviorState("idle");
      setAction("idle");
    },
    [getAnchorPosition, setAnchorPosition],
  );

  const lockToUndersideAndIdle = useCallback(async () => {
    targetXRef.current = null;
    targetYRef.current = null;
    const anchor = getAnchorPosition();
    await setAnchorPosition(anchor, "locked");
    setBehaviorState("idle");
    setAction("idle");
  }, [getAnchorPosition, setAnchorPosition]);

  const handleDragMove = useCallback(
    (anchor: ScreenPosition) => {
      clearTitleBarHoverProbe();

      titleBarHoverProbeRef.current = window.setTimeout(() => {
        titleBarHoverProbeRef.current = null;

        void hitTitleBarAt(anchor.x, anchor.y).then((titleBar) => {
          if (titleBar !== null) {
            setShowTitleBarLockHint(true);
            return;
          }

          void hitWindowWallAt(anchor.x, anchor.y).then((wall) => {
            if (wall !== null) {
              setShowTitleBarLockHint(true);
              return;
            }

            void hitWindowBottomAt(anchor.x, anchor.y).then((bottom) => {
              if (bottom !== null) {
                setShowTitleBarLockHint(true);
                return;
              }

              if (desktopBounds) {
                setShowTitleBarLockHint(
                  hitScreenEdgeWallAt(anchor.x, anchor.y, desktopBounds) !==
                    null,
                );
              }
            });
          });
        });
      }, TITLE_BAR_HOVER_PROBE_MS);
    },
    [clearTitleBarHoverProbe, desktopBounds],
  );

  useEffect(() => {
    return () => {
      clearTitleBarHoverProbe();
    };
  }, [clearTitleBarHoverProbe]);

  const handleDragStart = useCallback(() => {
    unfreeze();

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
  }, [clearSurfaceLock, clearTitleBarLockHint, unfreeze]);

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
        const locked = await tryLockSurfaceAt(anchor.x, anchor.y);

        if (locked?.kind === "titleBar") {
          const floorY = getFloorYAt(anchor.x, anchor.y);
          await setAnchorPosition(
            { x: clampAnchorX(anchor.x), y: floorY },
            "grounded",
          );
          startBounce();
          return;
        }

        if (locked?.kind === "wallLeft" || locked?.kind === "wallRight") {
          await lockToWallAndIdle(locked);
          return;
        }

        if (locked?.kind === "underside") {
          await lockToUndersideAndIdle();
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
      lockToWallAndIdle,
      lockToUndersideAndIdle,
    ],
  );

  const dragEnabled =
    isReady &&
    (behaviorState === "idle" ||
      behaviorState === "walking" ||
      behaviorState === "climbing" ||
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
    targetYRef.current = null;
    targetXRef.current = targetX;
    setFacing(direction);
    setBehaviorState("walking");
    setAction("walk");
  }, []);

  const startCrawlingTo = useCallback((targetX: number) => {
    const currentX = anchorXRef.current;
    const direction: FacingDirection = targetX >= currentX ? "right" : "left";

    sittingModeRef.current = null;
    targetYRef.current = null;
    targetXRef.current = targetX;
    setFacing(direction);
    setBehaviorState("walking");
    setAction("climbCeiling");
  }, []);

  const startClimbingTo = useCallback((targetY: number) => {
    const currentY = anchorYRef.current;

    targetXRef.current = null;
    targetYRef.current = targetY;
    setBehaviorState("climbing");
    setAction(targetY < currentY ? "climbWall" : "climbWallDown");
  }, []);

  const toggleFreeze = useCallback(() => {
    setIsFrozen((current) => !current);
  }, []);

  const turnAround = useCallback(() => {
    const currentState = behaviorStateRef.current;
    if (
      currentState === "walking" ||
      currentState === "climbing" ||
      currentState === "dragging" ||
      currentState === "falling" ||
      currentState === "bouncing"
    ) {
      return;
    }

    unfreeze();
    setFacing((current) => (current === "left" ? "right" : "left"));
  }, [unfreeze]);

  const walkToAnchorX = useCallback(
    (screenX: number) => {
      unfreeze();

      if (isWallLockedRef.current || isUndersideLockedRef.current) {
        return;
      }

      const currentState = behaviorStateRef.current;
      if (
        currentState === "dragging" ||
        currentState === "falling" ||
        currentState === "bouncing" ||
        currentState === "climbing"
      ) {
        return;
      }

      if (currentState === "dialoguing") {
        setDialogueText(null);
      }

      targetYRef.current = null;

      const targetX = clampAnchorX(screenX);
      startWalkingTo(targetX);
    },
    [clampAnchorX, startWalkingTo, unfreeze],
  );

  const crawlToAnchorX = useCallback(
    (screenX: number) => {
      unfreeze();

      if (!isUndersideLockedRef.current) {
        return;
      }

      const currentState = behaviorStateRef.current;
      if (
        currentState === "dragging" ||
        currentState === "falling" ||
        currentState === "bouncing" ||
        currentState === "climbing"
      ) {
        return;
      }

      if (currentState === "dialoguing") {
        setDialogueText(null);
      }

      targetYRef.current = null;

      const targetX = clampAnchorX(screenX);
      startCrawlingTo(targetX);
    },
    [clampAnchorX, startCrawlingTo, unfreeze],
  );

  const climbToAnchorY = useCallback(
    (screenY: number) => {
      unfreeze();

      if (!isWallLockedRef.current) {
        return;
      }

      const currentState = behaviorStateRef.current;
      if (
        currentState === "dragging" ||
        currentState === "falling" ||
        currentState === "bouncing" ||
        currentState === "walking"
      ) {
        return;
      }

      if (currentState === "dialoguing") {
        setDialogueText(null);
      }

      const range = getVerticalClimbRange();
      if (!range) {
        return;
      }

      targetXRef.current = null;

      const targetY = Math.min(
        range.maxY,
        Math.max(range.minY, screenY),
      );

      if (Math.abs(targetY - anchorYRef.current) < 8) {
        return;
      }

      startClimbingTo(targetY);
    },
    [getVerticalClimbRange, startClimbingTo, unfreeze],
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
    if (
      !isReady ||
      behaviorState !== "idle" ||
      isWallLocked ||
      isUndersideLocked ||
      isFrozen
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (behaviorStateRef.current !== "idle" || isFrozenRef.current) {
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
  }, [
    behaviorState,
    isFrozen,
    isReady,
    isUndersideLocked,
    isWallLocked,
    pickWalkTarget,
    startSitting,
    startWalkingTo,
  ]);

  // window bottom crawl — horizontal autonomous moves
  useEffect(() => {
    if (!isReady || behaviorState !== "idle" || !isUndersideLocked || isFrozen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        behaviorStateRef.current !== "idle" ||
        isFrozenRef.current ||
        !isUndersideLockedRef.current
      ) {
        return;
      }

      const target = pickWalkTarget();
      if (target === null) {
        return;
      }

      startCrawlingTo(target);
    }, randomIdleDelay());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    behaviorState,
    isFrozen,
    isReady,
    isUndersideLocked,
    pickWalkTarget,
    startCrawlingTo,
  ]);

  // on a window wall, sometimes climb up or down
  useEffect(() => {
    if (!isReady || behaviorState !== "idle" || !isWallLocked || isFrozen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (behaviorStateRef.current !== "idle" || isFrozenRef.current) {
        return;
      }

      const range = getVerticalClimbRange();
      if (!range) {
        return;
      }

      let nextTarget = randomBetween(range.minY, range.maxY);

      if (Math.abs(nextTarget - anchorYRef.current) < 48) {
        nextTarget =
          nextTarget >= anchorYRef.current ? range.minY : range.maxY;
      }

      if (Math.abs(nextTarget - anchorYRef.current) < 48) {
        return;
      }

      startClimbingTo(nextTarget);
    }, randomIdleDelay());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    behaviorState,
    getVerticalClimbRange,
    isFrozen,
    isReady,
    isWallLocked,
    startClimbingTo,
  ]);

  // auto sit eventually stands back up; manual sit stays until the user toggles it
  useEffect(() => {
    if (
      behaviorState !== "sitting" ||
      sittingModeRef.current !== "auto" ||
      isFrozen
    ) {
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
  }, [behaviorState, isFrozen, returnToIdle]);

  useAutonomousDialogue({
    isReady,
    isFrozen,
    isFrozenRef,
    behaviorState,
    behaviorStateRef,
    startDialogue,
  });

  const finishClimbing = useCallback(
    async (targetY: number) => {
      targetYRef.current = null;
      const current = getAnchorPosition();
      await setAnchorPosition({ x: current.x, y: targetY }, "locked");
      setBehaviorState("idle");
      setAction("idle");
    },
    [getAnchorPosition, setAnchorPosition],
  );

  const finishWalking = useCallback(
    async (targetX: number) => {
      targetXRef.current = null;
      await setAnchorX(targetX);
      setBehaviorState("idle");
      setAction("idle");
    },
    [setAnchorX],
  );

  const tryFinishWalkAtWall = useCallback(
    async (fallbackX: number) => {
      if (isUndersideLockedRef.current) {
        await finishWalking(fallbackX);
        return;
      }

      const anchor = getAnchorPosition();
      const locked = await tryLockSurfaceAt(anchor.x, anchor.y);

      if (locked && isWallLock(locked.kind)) {
        await lockToWallAndIdle(locked);
        return;
      }

      await finishWalking(fallbackX);
    },
    [finishWalking, getAnchorPosition, lockToWallAndIdle, tryLockSurfaceAt],
  );

  const onClimbTick = useCallback(
    (deltaY: number) => {
      if (behaviorState !== "climbing" || targetYRef.current === null) {
        return;
      }

      const currentY = anchorYRef.current;
      const targetY = targetYRef.current;
      const nextY = currentY + deltaY;
      const climbingUp = deltaY < 0;
      const reachedTarget =
        (climbingUp && nextY <= targetY) ||
        (!climbingUp && nextY >= targetY);

      if (reachedTarget) {
        void finishClimbing(targetY);
        return;
      }

      const moved = moveByY(deltaY);
      if (!moved) {
        void finishClimbing(currentY);
      }
    },
    [behaviorState, finishClimbing, moveByY],
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
        void tryFinishWalkAtWall(clampAnchorX(targetX));
        return;
      }

      const moved = moveBy(deltaX);
      if (!moved) {
        void tryFinishWalkAtWall(clampAnchorX(currentX));
      }
    },
    [behaviorState, clampAnchorX, facing, moveBy, tryFinishWalkAtWall],
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
        behaviorState === "climbing" ||
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

      void showCompanionMenu(
        event.screenX,
        event.screenY,
        isWallLocked,
        isUndersideLocked,
        isFrozen,
      );
    },
    [canOpenContextMenu, isFrozen, isUndersideLocked, isWallLocked],
  );

  return {
    action,
    displayAction,
    facing,
    behaviorState,
    dialogueText,
    isReady,
    showTitleBarLockHint,
    wallSide,
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
    canOpenContextMenu,
    onContextMenu,
  };
}
