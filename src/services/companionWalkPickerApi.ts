import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import type { WalkPickerSelectedPayload } from "../types/companionMenu";

export const WALK_PICKER_SELECTED_EVENT = "walk-picker-selected";
export const WALK_PICKER_CANCEL_EVENT = "walk-picker-cancel";

export async function showWalkPicker(): Promise<void> {
  await invoke("show_walk_picker");
}

export async function hideWalkPicker(): Promise<void> {
  await invoke("hide_walk_picker");
}

export async function submitWalkPickerTarget(anchorX: number): Promise<void> {
  await invoke("submit_walk_picker_target", { anchorX });
}

export async function cancelWalkPicker(): Promise<void> {
  await invoke("cancel_walk_picker");
}

export async function listenWalkPickerSelected(
  handler: (payload: WalkPickerSelectedPayload) => void,
): Promise<UnlistenFn> {
  return listen<WalkPickerSelectedPayload>(
    WALK_PICKER_SELECTED_EVENT,
    (event) => {
      handler(event.payload);
    },
  );
}

export async function listenWalkPickerCancel(
  handler: () => void,
): Promise<UnlistenFn> {
  return listen(WALK_PICKER_CANCEL_EVENT, () => {
    handler();
  });
}
