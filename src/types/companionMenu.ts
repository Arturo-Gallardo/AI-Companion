export type CompanionMenuAction = "walkTo" | "turnAround" | "sit";

export interface CompanionMenuActionPayload {
  action: CompanionMenuAction;
}

export interface WalkPickerSelectedPayload {
  anchorX: number;
}
