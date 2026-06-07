import { emitTo, type UnlistenFn } from "@tauri-apps/api/event";
import {
  companionWindowLabel,
  listenOnThisWebview,
} from "./companionInstanceContext";

export const COMPANION_SIT_TOGGLE_EVENT = "companion-sit-toggle";

export async function emitSitToggle(instanceId = "default"): Promise<void> {
  await emitTo(companionWindowLabel(instanceId), COMPANION_SIT_TOGGLE_EVENT);
}

export async function listenSitToggle(handler: () => void): Promise<UnlistenFn> {
  return listenOnThisWebview(COMPANION_SIT_TOGGLE_EVENT, () => {
    handler();
  });
}
