import { DEFAULT_GRABBED_LEAN_FRAME } from "../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../animations/types";
import type { CompanionBehaviorState } from "./companion";

export interface CompanionMirrorState {
  action: CompanionAction;
  facing: FacingDirection;
  grabbedLeanFrame: string;
  isDragging: boolean;
  behaviorState: CompanionBehaviorState;
  dialogueText: string | null;
}

export const DEFAULT_COMPANION_MIRROR_STATE: CompanionMirrorState = {
  action: "idle",
  facing: "left",
  grabbedLeanFrame: DEFAULT_GRABBED_LEAN_FRAME,
  isDragging: false,
  behaviorState: "idle",
  dialogueText: null,
};
