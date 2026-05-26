import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { CompanionMirrorState } from "../types/companionMirror";

export const COMPANION_MIRROR_EVENT = "companion-mirror-state";

export async function emitMirrorState(state: CompanionMirrorState): Promise<void> {
  await emit(COMPANION_MIRROR_EVENT, state);
}

export async function listenMirrorState(
  handler: (state: CompanionMirrorState) => void,
): Promise<UnlistenFn> {
  return listen<CompanionMirrorState>(COMPANION_MIRROR_EVENT, (event) => {
    handler(event.payload);
  });
}
