import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import type {
  CompanionMenuAction,
  CompanionMenuActionPayload,
} from "../types/companionMenu";

export const COMPANION_MENU_ACTION_EVENT = "companion-menu-action";

export async function showCompanionMenu(
  screenX: number,
  screenY: number,
): Promise<void> {
  await invoke("show_companion_menu", { screenX, screenY });
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
