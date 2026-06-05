import { invoke } from "@tauri-apps/api/core";
import type {
  DesktopBounds,
  ScreenPosition,
  WindowBottomHit,
  WindowSurface,
  WindowWallHit,
  WorkArea,
} from "../types/companion";

export async function getWorkArea(): Promise<WorkArea> {
  return invoke<WorkArea>("get_work_area");
}

export async function getDesktopBounds(): Promise<DesktopBounds> {
  return invoke<DesktopBounds>("get_desktop_bounds");
}

export async function setCompanionPosition(
  position: ScreenPosition,
  anchorYOffset = 128,
): Promise<void> {
  await invoke("set_companion_position", {
    x: position.x,
    y: position.y,
    anchorYOffset,
  });
}

export async function setCompanionEnabled(enabled: boolean): Promise<void> {
  await invoke("set_companion_enabled", { enabled });
}

export async function getWindowSurfaces(): Promise<WindowSurface[]> {
  return invoke<WindowSurface[]>("get_window_surfaces");
}

export async function hitTitleBarAt(
  x: number,
  y: number,
): Promise<WindowSurface | null> {
  return invoke<WindowSurface | null>("hit_title_bar_at", { x, y });
}

export async function hitWindowWallAt(
  x: number,
  y: number,
): Promise<WindowWallHit | null> {
  return invoke<WindowWallHit | null>("hit_window_wall_at", { x, y });
}

export async function hitWindowBottomAt(
  x: number,
  y: number,
): Promise<WindowBottomHit | null> {
  return invoke<WindowBottomHit | null>("hit_window_bottom_at", { x, y });
}
