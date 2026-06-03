import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";

export const COMPANION_FREEZE_TOGGLE_EVENT = "companion-freeze-toggle";

export async function emitFreezeToggle(): Promise<void> {
  await emit(COMPANION_FREEZE_TOGGLE_EVENT);
}

export async function listenFreezeToggle(
  handler: () => void,
): Promise<UnlistenFn> {
  return listen(COMPANION_FREEZE_TOGGLE_EVENT, () => {
    handler();
  });
}
