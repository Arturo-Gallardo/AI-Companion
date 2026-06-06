import { useEffect } from "react";
import { emitMirrorState } from "../services/companionMirror";
import type { CompanionMirrorState } from "../types/companionMirror";

export function useCompanionMirrorBroadcast(state: CompanionMirrorState): void {
  useEffect(() => {
    void emitMirrorState(state);
  }, [
    state.instanceId,
    state.action,
    state.facing,
    state.grabbedLeanTier,
    state.isDragging,
    state.behaviorState,
    state.dialogueText,
    state.isFrozen,
  ]);
}
