export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface MonitorWorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopBounds {
  monitors: MonitorWorkArea[];
  virtualLeft: number;
  virtualTop: number;
  virtualWidth: number;
  virtualHeight: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export type CompanionBehaviorState =
  | "idle"
  | "walking"
  | "dragging"
  | "falling"
  | "bouncing"
  | "dialoguing";

// gap between sprite top and speech window bottom
export const SPEECH_BUBBLE_GAP = 4;
export type AnchorClampMode = "walls" | "grounded";

export interface DragOffset {
  x: number;
  y: number;
}

export interface FallVelocity {
  x: number;
  y: number;
}
