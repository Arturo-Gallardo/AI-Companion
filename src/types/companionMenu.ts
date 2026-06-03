export type CompanionMenuAction =
  | "walkTo"
  | "climbTo"
  | "turnAround"
  | "sit"
  | "toggleFreeze";

export type TargetPickerMode = "walk" | "climb";

export interface CompanionMenuActionPayload {
  action: CompanionMenuAction;
}

export interface CompanionMenuConfigPayload {
  wallLocked: boolean;
  frozen: boolean;
}

export interface TargetPickerOpenPayload {
  mode: TargetPickerMode;
}

export interface TargetPickerSelectedPayload {
  mode: TargetPickerMode;
  anchorX: number;
  anchorY: number;
}
