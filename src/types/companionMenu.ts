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
  targetLabel: string;
}

export interface TargetPickerOpenPayload {
  mode: TargetPickerMode;
  targetLabel: string;
}

export interface TargetPickerSelectedPayload {
  mode: TargetPickerMode;
  anchorX: number;
  anchorY: number;
}
