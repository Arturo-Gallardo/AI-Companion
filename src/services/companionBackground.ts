import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { CompanionBackgroundMode } from "../types/companionBackground";

export const COMPANION_BACKGROUND_MODE_EVENT = "companion-background-mode";

export interface CompanionBackgroundModePayload {
  mode: CompanionBackgroundMode;
}

export async function emitCompanionBackgroundMode(
  mode: CompanionBackgroundMode,
): Promise<void> {
  await emit(COMPANION_BACKGROUND_MODE_EVENT, {
    mode,
  } satisfies CompanionBackgroundModePayload);
}

export async function listenCompanionBackgroundMode(
  handler: (mode: CompanionBackgroundMode) => void,
): Promise<UnlistenFn> {
  return listen<CompanionBackgroundModePayload>(
    COMPANION_BACKGROUND_MODE_EVENT,
    (event) => {
      handler(event.payload.mode);
    },
  );
}
