import type { CompanionAction, FacingDirection } from "../animations/types";

export interface CompanionMirrorState {
  action: CompanionAction;
  facing: FacingDirection;
  grabbedVelocityX: number;
  isDragging: boolean;
}

export const DEFAULT_COMPANION_MIRROR_STATE: CompanionMirrorState = {
  action: "idle",
  facing: "left",
  grabbedVelocityX: 0,
  isDragging: false,
};
