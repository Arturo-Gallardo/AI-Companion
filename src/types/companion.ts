import { SPRITE_HEIGHT } from "../animations/beyondBirthday";

// how long dialogue stays visible before auto-dismiss
export const DIALOGUE_DISPLAY_MS = 3000;

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

// extra space above the sprite for speech bubbles
export const SPEECH_AREA_HEIGHT = 72;
export const COMPANION_WINDOW_HEIGHT = SPRITE_HEIGHT + SPEECH_AREA_HEIGHT;

export type AnchorClampMode = "walls" | "grounded";

export interface DragOffset {
  x: number;
  y: number;
}

export interface FallVelocity {
  x: number;
  y: number;
}
