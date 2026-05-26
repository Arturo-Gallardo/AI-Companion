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
  velocity: Velocity;
}

export type CompanionAction =
  | "idle"
  | "walk"
  | "grabbed"
  | "resist"
  | "fall"
  | "bounce";

export type FacingDirection = "left" | "right";
