import { emitTo, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { listenOnThisWebview } from "./companionInstanceContext";
import type {
  CompanionMenuAction,
  CompanionMenuActionPayload,
  CompanionMenuAnimationAction,
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
  availableActions: readonly CompanionMenuAnimationAction[],
): Promise<void> {
  await invoke("show_companion_menu", {
    screenX,
    screenY,
    wallLocked,
    undersideLocked,
    frozen,
    availableActions,
  });
}

export async function hideCompanionMenu(): Promise<void> {
  await invoke("hide_companion_menu");
}

export async function emitCompanionMenuAction(
  targetLabel: string,
  action: CompanionMenuAction,
): Promise<void> {
  await emitTo(targetLabel, COMPANION_MENU_ACTION_EVENT, {
    action,
  } satisfies CompanionMenuActionPayload);
}

export async function listenCompanionMenuAction(
  handler: (payload: CompanionMenuActionPayload) => void,
): Promise<UnlistenFn> {
  return listenOnThisWebview<CompanionMenuActionPayload>(
    COMPANION_MENU_ACTION_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}

export async function listenCompanionMenuConfig(
  handler: (payload: CompanionMenuConfigPayload) => void,
): Promise<UnlistenFn> {
  return listenOnThisWebview<CompanionMenuConfigPayload>(
    COMPANION_MENU_CONFIG_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}
