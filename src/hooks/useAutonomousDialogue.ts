import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { CompanionBehaviorState } from "../types/companion";
import { pickRandomMotivationalQuote } from "../utils/pickRandomQuote";

const MIN_AUTONOMOUS_DIALOGUE_MS = 20000;
const MAX_AUTONOMOUS_DIALOGUE_MS = 50000;
const AUTONOMOUS_DIALOGUE_CHANCE = 0.2;

const ELIGIBLE_STATES: ReadonlySet<CompanionBehaviorState> = new Set([
  "idle",
  "walking",
  "sitting",
]);

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function isAutonomousDialogueEligible(state: CompanionBehaviorState): boolean {
  return ELIGIBLE_STATES.has(state);
}

interface UseAutonomousDialogueOptions {
  isReady: boolean;
  isFrozen: boolean;
  isFrozenRef: RefObject<boolean>;
  behaviorState: CompanionBehaviorState;
  behaviorStateRef: RefObject<CompanionBehaviorState>;
  startDialogue: (text: string) => void;
}

export function useAutonomousDialogue({
  isReady,
  isFrozen,
  isFrozenRef,
  behaviorState,
  behaviorStateRef,
  startDialogue,
}: UseAutonomousDialogueOptions): void {
  const startDialogueRef = useRef(startDialogue);

  useEffect(() => {
    startDialogueRef.current = startDialogue;
  }, [startDialogue]);

  useEffect(() => {
    if (!isReady || isFrozen || !isAutonomousDialogueEligible(behaviorState)) {
      return;
    }

    let cancelled = false;
    let timeoutId = 0;

    const scheduleNext = () => {
      timeoutId = window.setTimeout(
        () => {
          if (cancelled || isFrozenRef.current) {
            return;
          }

          const currentState = behaviorStateRef.current;
          if (
            currentState === undefined ||
            !isAutonomousDialogueEligible(currentState)
          ) {
            return;
          }

          if (Math.random() < AUTONOMOUS_DIALOGUE_CHANCE) {
            startDialogueRef.current(pickRandomMotivationalQuote());
          }

          scheduleNext();
        },
        randomBetween(MIN_AUTONOMOUS_DIALOGUE_MS, MAX_AUTONOMOUS_DIALOGUE_MS),
      );
    };

    scheduleNext();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [behaviorState, behaviorStateRef, isFrozen, isFrozenRef, isReady]);
}
