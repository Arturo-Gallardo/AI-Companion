import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import type {
  CompanionMenuAction,
  CompanionMenuActionPayload,
  CompanionMenuConfigPayload,
} from "../types/companionMenu";

export const COMPANION_MENU_ACTION_EVENT = "companion-menu-action";
export const COMPANION_MENU_CONFIG_EVENT = "companion-menu-config";

export async function showCompanionMenu(
  screenX: number,
  screenY: number,
  wallLocked: boolean,
  undersideLocked: boolean,
  frozen: boolean,
): Promise<void> {
  await invoke("show_companion_menu", {
    screenX,
    screenY,
    wallLocked,
    undersideLocked,
    frozen,
  });
}

export async function hideCompanionMenu(): Promise<void> {
  await invoke("hide_companion_menu");
}

export async function emitCompanionMenuAction(
  action: CompanionMenuAction,
): Promise<void> {
  await emitTo("companion", COMPANION_MENU_ACTION_EVENT, {
    action,
  } satisfies CompanionMenuActionPayload);
}

export async function listenCompanionMenuAction(
  handler: (payload: CompanionMenuActionPayload) => void,
): Promise<UnlistenFn> {
  return listen<CompanionMenuActionPayload>(
    COMPANION_MENU_ACTION_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}

export async function listenCompanionMenuConfig(
  handler: (payload: CompanionMenuConfigPayload) => void,
): Promise<UnlistenFn> {
  return listen<CompanionMenuConfigPayload>(
    COMPANION_MENU_CONFIG_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}
