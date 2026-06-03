export type CompanionMenuAction =
  | "walkTo"
  | "crawlTo"
  | "climbTo"
  | "turnAround"
  | "sit"
  | "toggleFreeze";

export type TargetPickerMode = "walk" | "crawl" | "climb";

export interface CompanionMenuActionPayload {
  action: CompanionMenuAction;
}

export interface CompanionMenuConfigPayload {
  wallLocked: boolean;
  undersideLocked: boolean;
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
