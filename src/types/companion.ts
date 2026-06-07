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

export interface WindowSurface {
  hwnd: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  titleBarBottom: number;
}

export type WindowWallSide = "left" | "right";

export interface WindowWallHit {
  hwnd: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  side: WindowWallSide;
}

export interface WindowBottomHit {
  hwnd: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type SurfaceLockKind =
  | "titleBar"
  | "wallLeft"
  | "wallRight"
  | "underside";

export interface SurfaceLock {
  hwnd: number;
  kind: SurfaceLockKind;
}

export type CompanionBehaviorState =
  | "idle"
  | "walking"
  | "climbing"
  | "sitting"
  | "dragging"
  | "falling"
  | "bouncing"
  | "emoting"
  | "dialoguing";

// gap between sprite top and speech window bottom
export const SPEECH_BUBBLE_GAP = 4;
export type AnchorClampMode = "walls" | "grounded" | "locked";

export interface DragOffset {
  x: number;
  y: number;
}

export interface FallVelocity {
  x: number;
  y: number;
}
