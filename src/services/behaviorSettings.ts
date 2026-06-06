import type { BehaviorSettings } from "../types/character";

export const DEFAULT_BEHAVIOR_SETTINGS: BehaviorSettings = {
  movementSpeed: 1,
  actionFrequency: 0.5,
  dialogueFrequency: 0.2,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// fills in any missing fields and clamps the 0..1 frequencies so persisted or
// imported settings can never push the behavior engine out of range.
export function normalizeBehaviorSettings(
  settings: Partial<BehaviorSettings> | undefined,
): BehaviorSettings {
  return {
    movementSpeed: Math.max(
      0.1,
      settings?.movementSpeed ?? DEFAULT_BEHAVIOR_SETTINGS.movementSpeed,
    ),
    actionFrequency: clamp01(
      settings?.actionFrequency ?? DEFAULT_BEHAVIOR_SETTINGS.actionFrequency,
    ),
    dialogueFrequency: clamp01(
      settings?.dialogueFrequency ?? DEFAULT_BEHAVIOR_SETTINGS.dialogueFrequency,
    ),
  };
}
