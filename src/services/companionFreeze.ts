import { emitTo, type UnlistenFn } from "@tauri-apps/api/event";
import {
  companionWindowLabel,
  listenOnThisWebview,
} from "./companionInstanceContext";

export const COMPANION_FREEZE_TOGGLE_EVENT = "companion-freeze-toggle";

export async function emitFreezeToggle(instanceId = "default"): Promise<void> {
  await emitTo(
    companionWindowLabel(instanceId),
    COMPANION_FREEZE_TOGGLE_EVENT,
  );
}

export async function listenFreezeToggle(
  handler: () => void,
): Promise<UnlistenFn> {
  return listenOnThisWebview(COMPANION_FREEZE_TOGGLE_EVENT, () => {
    handler();
  });
}
