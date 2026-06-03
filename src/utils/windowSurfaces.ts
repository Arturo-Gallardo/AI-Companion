import { SPRITE_ANCHOR } from "../animations/beyondBirthday";
import type { MonitorWorkArea, WindowSurface } from "../types/companion";
import { getFloorYAt } from "./monitorBounds";

const HORIZONTAL_PADDING = SPRITE_ANCHOR.x;

export const LOCKED_SURFACE_MOVE_THRESHOLD = 4;

export interface LockedSurfaceSnapshot {
  hwnd: number;
  left: number;
  top: number;
  right: number;
}

export function toLockedSurfaceSnapshot(
  surface: WindowSurface,
): LockedSurfaceSnapshot {
  return {
    hwnd: surface.hwnd,
    left: surface.left,
    top: surface.top,
    right: surface.right,
  };
}

export function hasLockedSurfaceMoved(
  previous: LockedSurfaceSnapshot,
  current: WindowSurface,
): boolean {
  if (previous.hwnd !== current.hwnd) {
    return true;
  }

  return (
    Math.abs(previous.top - current.top) > LOCKED_SURFACE_MOVE_THRESHOLD ||
    Math.abs(previous.left - current.left) > LOCKED_SURFACE_MOVE_THRESHOLD ||
    Math.abs(previous.right - current.right) > LOCKED_SURFACE_MOVE_THRESHOLD
  );
}

export function findSurfaceByHwnd(
  surfaces: WindowSurface[],
  hwnd: number | null,
): WindowSurface | null {
  if (hwnd === null) {
    return null;
  }

  return surfaces.find((surface) => surface.hwnd === hwnd) ?? null;
}

export function getSurfaceHorizontalRange(surface: WindowSurface): {
  minX: number;
  maxX: number;
} {
  return {
    minX: surface.left + HORIZONTAL_PADDING,
    maxX: surface.right - HORIZONTAL_PADDING,
  };
}

export function clampXToRange(x: number, minX: number, maxX: number): number {
  if (minX > maxX) {
    return (minX + maxX) / 2;
  }

  return Math.min(Math.max(x, minX), maxX);
}

export function resolveFloorYAt(
  x: number,
  y: number,
  monitors: MonitorWorkArea[],
  lockedSurface: WindowSurface | null,
): number {
  if (lockedSurface) {
    return lockedSurface.top;
  }

  return getFloorYAt(x, y, monitors);
}
