import { useCallback, useEffect, useRef, useState } from "react";
import type { CompanionAction, FacingDirection } from "../animations/types";
import { LANDING_THRESHOLD } from "../animations/beyondBirthday";
import {
  DIALOGUE_DISPLAY_MS,
  type CompanionBehaviorState,
  type FallVelocity,
} from "../types/companion";
import { getDesktopHorizontalRange } from "../utils/monitorBounds";
import { useCompanionDrag } from "./useCompanionDrag";
import { useCompanionFall } from "./useCompanionFall";
import { useCompanionMovement } from "./useCompanionMovement";

const MIN_IDLE_MS = 3000;
const MAX_IDLE_MS = 8000;
const MIN_WALK_DISTANCE = 80;

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
  grabbedLeanFrame: string;
  onWalkTick: (deltaX: number) => void;
  onBounceComplete: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  startDialogue: (text: string) => void;
  dismissDialogue: () => void;
}

export function useCompanionBehavior(): UseCompanionBehaviorResult {
  const {
    desktopBounds,
    anchorX,
    isReady,
    moveBy,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls,
    getFloorYAt,
    getAnchorPosition,
  } = useCompanionMovement();

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

  const targetXRef = useRef<number | null>(null);
  const anchorXRef = useRef(anchorX);
  const isDraggingRef = useRef(false);
  const behaviorStateRef = useRef(behaviorState);

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
    setSkipResistOnGrab(false);
    setDialogueText(null);
    setBehaviorState("idle");
    setAction("idle");
  }, []);

  const startDialogue = useCallback((text: string) => {
    const currentState = behaviorStateRef.current;
    if (currentState !== "idle" && currentState !== "walking") {
      return;
    }

    // clears any in-progress walk target so movement stops immediately
    targetXRef.current = null;
    setDialogueText(text);
    setBehaviorState("dialoguing");
    setAction("idle");
  }, []);

  const dismissDialogue = useCallback(() => {
    if (behaviorStateRef.current !== "dialoguing") {
      return;
    }

    setDialogueText(null);
    setBehaviorState("idle");
    setAction("idle");
  }, []);

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

  const handleDragStart = useCallback(() => {
    const currentState = behaviorStateRef.current;
    const wasFalling = currentState === "falling";

    targetXRef.current = null;
    isDraggingRef.current = true;
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
  }, []);

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

      const floorY = getFloorYAt(anchor.x, anchor.y);

      if (anchor.y >= floorY - LANDING_THRESHOLD) {
        void setAnchorPosition({ x: anchor.x, y: floorY }, "grounded").then(() => {
          startBounce();
        });
        return;
      }

      setFallVelocity(releaseVelocity);
      setBehaviorState("falling");
      setAction("fall");
    },
    [getFloorYAt, setAnchorPosition, startBounce],
  );

  const dragEnabled =
    isReady &&
    (behaviorState === "idle" ||
      behaviorState === "walking" ||
      behaviorState === "dialoguing" ||
      behaviorState === "falling");

  const { grabbedLeanFrame, onPointerDown } = useCompanionDrag({
    isEnabled: dragEnabled,
    skipResistDelay: skipResistOnGrab,
    getAnchorPosition,
    setAnchorPosition,
    onDragStart: handleDragStart,
    onResistEnd: handleResistEnd,
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

    targetXRef.current = targetX;
    setFacing(direction);
    setBehaviorState("walking");
    setAction("walk");
  }, []);

  const pickWalkTarget = useCallback(() => {
    if (!desktopBounds) {
      return null;
    }

    const { minX, maxX } = getDesktopHorizontalRange(desktopBounds);
    let nextTarget = clampAnchorX(randomBetween(minX, maxX));

    if (Math.abs(nextTarget - anchorXRef.current) < MIN_WALK_DISTANCE) {
      const alternate = nextTarget > anchorXRef.current ? minX : maxX;
      nextTarget = clampAnchorX(alternate);
    }

    if (Math.abs(nextTarget - anchorXRef.current) < MIN_WALK_DISTANCE) {
      return null;
    }

    return nextTarget;
  }, [clampAnchorX, desktopBounds]);

  useEffect(() => {
    if (!isReady || behaviorState !== "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const target = pickWalkTarget();
      if (target === null) {
        return;
      }

      startWalkingTo(target);
    }, randomIdleDelay());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [behaviorState, isReady, pickWalkTarget, startWalkingTo]);

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
        void finishWalking(targetX);
        return;
      }

      moveBy(deltaX);
    },
    [behaviorState, facing, finishWalking, moveBy],
  );

  const onBounceComplete = useCallback(() => {
    if (behaviorState !== "bouncing") {
      return;
    }

    returnToIdle();
  }, [behaviorState, returnToIdle]);

  return {
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
  };
}
