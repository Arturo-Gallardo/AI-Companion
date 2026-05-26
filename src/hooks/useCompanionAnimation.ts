import { useEffect, useRef, useState } from "react";
import {
  getAnimationForAction,
  getFramePath,
  getGrabbedFrameFromVelocity,
  TICK_INTERVAL_MS,
} from "../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../animations/types";

interface UseCompanionAnimationOptions {
  action: CompanionAction;
  facing: FacingDirection;
  grabbedVelocityX: number;
  onTick?: (deltaX: number) => void;
  onBounceComplete?: () => void;
}

interface UseCompanionAnimationResult {
  frameSrc: string;
}

export function useCompanionAnimation({
  action,
  facing,
  grabbedVelocityX,
  onTick,
  onBounceComplete,
}: UseCompanionAnimationOptions): UseCompanionAnimationResult {
  const [frameIndex, setFrameIndex] = useState(0);
  const tickCountRef = useRef(0);
  const bounceCyclesRef = useRef(0);
  const onTickRef = useRef(onTick);
  const onBounceCompleteRef = useRef(onBounceComplete);

  useEffect(() => {
    onTickRef.current = onTick;
    onBounceCompleteRef.current = onBounceComplete;
  }, [onBounceComplete, onTick]);

  useEffect(() => {
    setFrameIndex(0);
    tickCountRef.current = 0;
    bounceCyclesRef.current = 0;
  }, [action]);

  useEffect(() => {
    if (action === "grabbed" || action === "fall") {
      return;
    }

    const animation = getAnimationForAction(action);
    const directionMultiplier = facing === "right" ? -1 : 1;

    const intervalId = window.setInterval(() => {
      tickCountRef.current += 1;

      if (action === "walk" && onTickRef.current) {
        onTickRef.current(animation.velocity.x * directionMultiplier);
      }

      if (tickCountRef.current >= animation.tickDuration) {
        tickCountRef.current = 0;

        if (action === "bounce") {
          setFrameIndex((current) => {
            const nextIndex = current + 1;

            if (nextIndex >= animation.frames.length) {
              bounceCyclesRef.current += 1;

              if (bounceCyclesRef.current >= 1) {
                onBounceCompleteRef.current?.();
              }

              return 0;
            }

            return nextIndex;
          });
          return;
        }

        setFrameIndex((current) => (current + 1) % animation.frames.length);
      }
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [action, facing]);

  if (action === "grabbed") {
    return {
      frameSrc: getFramePath(getGrabbedFrameFromVelocity(grabbedVelocityX)),
    };
  }

  const animation = getAnimationForAction(action);
  const frame = animation.frames[frameIndex] ?? animation.frames[0];

  return {
    frameSrc: getFramePath(frame),
  };
}
