import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_GRABBED_LEAN_FRAME,
  getAnimationForAction,
  getFramePath,
  getFrameTickDuration,
  TICK_INTERVAL_MS,
} from "../animations/beyondBirthday";
import type { AnimationDefinition, CompanionAction, FacingDirection } from "../animations/types";

interface UseCompanionAnimationOptions {
  action: CompanionAction;
  facing: FacingDirection;
  grabbedLeanFrame?: string;
  onTick?: (deltaX: number) => void;
  onClimbTick?: (deltaY: number) => void;
  onBounceComplete?: () => void;
}

interface UseCompanionAnimationResult {
  frameSrc: string;
}

function advanceFrameIndex(
  animation: AnimationDefinition,
  currentIndex: number,
): number {
  return (currentIndex + 1) % animation.frames.length;
}

export function useCompanionAnimation({
  action,
  facing,
  grabbedLeanFrame = DEFAULT_GRABBED_LEAN_FRAME,
  onTick,
  onClimbTick,
  onBounceComplete,
}: UseCompanionAnimationOptions): UseCompanionAnimationResult {
  const [frameIndex, setFrameIndex] = useState(0);
  const frameIndexRef = useRef(0);
  const frameShownAtRef = useRef(performance.now());
  const bounceCyclesRef = useRef(0);
  const actionRef = useRef(action);
  const facingRef = useRef(facing);
  const onTickRef = useRef(onTick);
  const onClimbTickRef = useRef(onClimbTick);
  const onBounceCompleteRef = useRef(onBounceComplete);

  useEffect(() => {
    actionRef.current = action;
    facingRef.current = facing;
  }, [action, facing]);

  useEffect(() => {
    onTickRef.current = onTick;
    onClimbTickRef.current = onClimbTick;
    onBounceCompleteRef.current = onBounceComplete;
  }, [onBounceComplete, onClimbTick, onTick]);

  useEffect(() => {
    frameIndexRef.current = 0;
    frameShownAtRef.current = performance.now();
    bounceCyclesRef.current = 0;
    setFrameIndex(0);
  }, [action]);

  useEffect(() => {
    const currentAction = actionRef.current;

    if (currentAction === "grabbed" || currentAction === "fall") {
      return;
    }

    const intervalId = window.setInterval(() => {
      const activeAction = actionRef.current;
      const animation = getAnimationForAction(activeAction);
      const directionMultiplier = facingRef.current === "right" ? -1 : 1;

      if (activeAction === "walk" && onTickRef.current) {
        onTickRef.current(animation.velocity.x * directionMultiplier);
      }

      if (
        (activeAction === "climbWall" || activeAction === "climbWallDown") &&
        onClimbTickRef.current
      ) {
        onClimbTickRef.current(animation.velocity.y);
      }

      const frameDurationMs =
        getFrameTickDuration(animation, frameIndexRef.current) *
        TICK_INTERVAL_MS;

      if (performance.now() - frameShownAtRef.current < frameDurationMs) {
        return;
      }

      frameShownAtRef.current = performance.now();

      if (activeAction === "bounce") {
        const nextIndex = frameIndexRef.current + 1;

        if (nextIndex >= animation.frames.length) {
          bounceCyclesRef.current += 1;

          if (bounceCyclesRef.current >= 1) {
            onBounceCompleteRef.current?.();
          }

          frameIndexRef.current = 0;
          setFrameIndex(0);
          return;
        }

        frameIndexRef.current = nextIndex;
        setFrameIndex(nextIndex);
        return;
      }

      const nextIndex = advanceFrameIndex(animation, frameIndexRef.current);
      frameIndexRef.current = nextIndex;
      setFrameIndex(nextIndex);
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [action]);

  if (action === "grabbed") {
    return {
      frameSrc: getFramePath(grabbedLeanFrame),
    };
  }

  const animation = getAnimationForAction(action);
  const frame = animation.frames[frameIndex] ?? animation.frames[0];

  return {
    frameSrc: getFramePath(frame),
  };
}
