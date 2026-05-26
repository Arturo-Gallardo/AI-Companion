import { DEFAULT_GRABBED_LEAN_FRAME } from "../animations/beyondBirthday";
import type { CompanionAction, FacingDirection } from "../animations/types";

export interface CompanionMirrorState {
  action: CompanionAction;
  facing: FacingDirection;
  grabbedLeanFrame: string;
  isDragging: boolean;
}

export const DEFAULT_COMPANION_MIRROR_STATE: CompanionMirrorState = {
  action: "idle",
  facing: "left",
  grabbedLeanFrame: DEFAULT_GRABBED_LEAN_FRAME,
  isDragging: false,
};
