import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";

export const COMPANION_SIT_TOGGLE_EVENT = "companion-sit-toggle";

export async function emitSitToggle(): Promise<void> {
  await emit(COMPANION_SIT_TOGGLE_EVENT);
}

export async function listenSitToggle(handler: () => void): Promise<UnlistenFn> {
  return listen(COMPANION_SIT_TOGGLE_EVENT, () => {
    handler();
  });
}
