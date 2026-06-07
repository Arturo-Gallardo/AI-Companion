import type { EventCallback, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

// label conventions shared between the dashboard and the per-instance windows:
//   companion-<id>         -> the companion sprite window
//   companion-speech-<id>  -> that companion's speech bubble window

export function companionWindowLabel(id: string): string {
  return `companion-${id}`;
}

export function speechWindowLabel(id: string): string {
  return `companion-speech-${id}`;
}

// extracts the instance id from a companion window label, ignoring the
// sibling speech windows that share the companion- prefix.
export function instanceIdFromLabel(label: string): string | null {
  if (label.startsWith("companion-speech-")) {
    return null;
  }

  if (!label.startsWith("companion-")) {
    return null;
  }

  return label.slice("companion-".length);
}

export function instanceIdFromSpeechLabel(label: string): string | null {
  if (!label.startsWith("companion-speech-")) {
    return null;
  }

  return label.slice("companion-speech-".length);
}

// the instance id of the window this code is running in (companion windows).
export function getCurrentInstanceId(): string | null {
  return instanceIdFromLabel(getCurrentWebviewWindow().label);
}

// tauri event.listen() receives emitTo events on every webview; scoped listen
// only gets events targeted at this window (see tauri-apps/tauri#11379).
export async function listenOnThisWebview<T>(
  event: string,
  handler: EventCallback<T>,
): Promise<UnlistenFn> {
  return getCurrentWebviewWindow().listen(event, handler);
}
