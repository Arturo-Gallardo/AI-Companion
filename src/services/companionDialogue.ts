import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";

export const COMPANION_DIALOGUE_START_EVENT = "companion-dialogue-start";
export const COMPANION_DIALOGUE_DISMISS_EVENT = "companion-dialogue-dismiss";

export interface CompanionDialogueStartPayload {
  text: string;
}

export async function emitDialogueStart(text: string): Promise<void> {
  await emit(COMPANION_DIALOGUE_START_EVENT, { text } satisfies CompanionDialogueStartPayload);
}

export async function emitDialogueDismiss(): Promise<void> {
  await emit(COMPANION_DIALOGUE_DISMISS_EVENT);
}

export async function listenDialogueStart(
  handler: (payload: CompanionDialogueStartPayload) => void,
): Promise<UnlistenFn> {
  return listen<CompanionDialogueStartPayload>(
    COMPANION_DIALOGUE_START_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}

export async function listenDialogueDismiss(
  handler: () => void,
): Promise<UnlistenFn> {
  return listen(COMPANION_DIALOGUE_DISMISS_EVENT, () => {
    handler();
  });
}
