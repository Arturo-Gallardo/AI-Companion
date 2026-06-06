import type {
  CompanionAction,
  FacingDirection,
  GrabbedLeanTier,
} from "../animations/types";
import type { CompanionBehaviorState } from "./companion";

export interface CompanionMirrorState {
  instanceId: string;
  action: CompanionAction;
  facing: FacingDirection;
  grabbedLeanTier: GrabbedLeanTier;
  isDragging: boolean;
  behaviorState: CompanionBehaviorState;
  dialogueText: string | null;
  isFrozen: boolean;
}

export const DEFAULT_COMPANION_MIRROR_STATE: CompanionMirrorState = {
  instanceId: "default",
  action: "idle",
  facing: "left",
  grabbedLeanTier: "neutral",
  isDragging: false,
  behaviorState: "idle",
  dialogueText: null,
  isFrozen: false,
};
