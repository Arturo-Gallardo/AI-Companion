export interface AnchorPoint {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface AnimationDefinition {
  frames: string[];
  tickDuration: number;
  // optional per-frame hold lengths in tick units (25ms each)
  frameTickDurations?: number[];
  velocity: Velocity;
}

export type CompanionAction =
  | "idle"
  | "walk"
  | "sit"
  | "grabbed"
  | "resist"
  | "fall"
  | "bounce";

export type FacingDirection = "left" | "right";
