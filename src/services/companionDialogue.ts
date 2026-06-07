import { emitTo, type UnlistenFn } from "@tauri-apps/api/event";
import {
  companionWindowLabel,
  listenOnThisWebview,
} from "./companionInstanceContext";

export const COMPANION_DIALOGUE_START_EVENT = "companion-dialogue-start";
export const COMPANION_DIALOGUE_DISMISS_EVENT = "companion-dialogue-dismiss";

export interface CompanionDialogueStartPayload {
  text: string;
}

export async function emitDialogueStart(
  text: string,
  instanceId = "default",
): Promise<void> {
  await emitTo(
    companionWindowLabel(instanceId),
    COMPANION_DIALOGUE_START_EVENT,
    { text } satisfies CompanionDialogueStartPayload,
  );
}

export async function emitDialogueDismiss(
  instanceId = "default",
): Promise<void> {
  await emitTo(
    companionWindowLabel(instanceId),
    COMPANION_DIALOGUE_DISMISS_EVENT,
  );
}

export async function listenDialogueStart(
  handler: (payload: CompanionDialogueStartPayload) => void,
): Promise<UnlistenFn> {
  return listenOnThisWebview<CompanionDialogueStartPayload>(
    COMPANION_DIALOGUE_START_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}

export async function listenDialogueDismiss(
  handler: () => void,
): Promise<UnlistenFn> {
  return listenOnThisWebview(COMPANION_DIALOGUE_DISMISS_EVENT, () => {
    handler();
  });
}
