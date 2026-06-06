import { useEffect, useRef, useState } from "react";
import { getFrameTickDuration, TICK_INTERVAL_MS } from "../animations/beyondBirthday";
import type {
  AnimationDefinition,
  CompanionAction,
  FacingDirection,
  GrabbedLeanTier,
} from "../animations/types";
import type { AnimationRegistry } from "../services/animationRegistry";

interface UseCompanionAnimationOptions {
  registry: AnimationRegistry;
  action: CompanionAction;
  facing: FacingDirection;
  grabbedLeanTier?: GrabbedLeanTier;
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
  registry,
  action,
  facing,
  grabbedLeanTier = "neutral",
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
  const registryRef = useRef(registry);
  const onTickRef = useRef(onTick);
  const onClimbTickRef = useRef(onClimbTick);
  const onBounceCompleteRef = useRef(onBounceComplete);

  useEffect(() => {
    actionRef.current = action;
    facingRef.current = facing;
    registryRef.current = registry;
  }, [action, facing, registry]);

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
      const animation = registryRef.current.getAnimation(activeAction);
      const directionMultiplier = facingRef.current === "right" ? -1 : 1;

      if (
        (activeAction === "walk" || activeAction === "climbCeiling") &&
        onTickRef.current
      ) {
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
      frameSrc: registry.getGrabbedLeanFrame(grabbedLeanTier),
    };
  }

  const animation = registry.getAnimation(action);
  const frame = animation.frames[frameIndex] ?? animation.frames[0];

  return {
    // registry frames are already resolved urls
    frameSrc: frame,
  };
}
