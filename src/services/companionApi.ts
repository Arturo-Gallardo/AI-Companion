import { invoke } from "@tauri-apps/api/core";
import type { DesktopBounds, ScreenPosition, WorkArea } from "../types/companion";

export async function getWorkArea(): Promise<WorkArea> {
  return invoke<WorkArea>("get_work_area");
}

export async function getDesktopBounds(): Promise<DesktopBounds> {
  return invoke<DesktopBounds>("get_desktop_bounds");
}

export async function setCompanionPosition(position: ScreenPosition): Promise<void> {
  await invoke("set_companion_position", { x: position.x, y: position.y });
}
