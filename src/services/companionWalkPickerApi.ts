import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import type {
  TargetPickerMode,
  TargetPickerOpenPayload,
  TargetPickerSelectedPayload,
} from "../types/companionMenu";

export const WALK_PICKER_SELECTED_EVENT = "walk-picker-selected";
export const WALK_PICKER_CANCEL_EVENT = "walk-picker-cancel";
export const TARGET_PICKER_OPEN_EVENT = "target-picker-open";

export async function showTargetPicker(mode: TargetPickerMode): Promise<void> {
  await invoke("show_walk_picker", { mode });
}

export async function hideWalkPicker(): Promise<void> {
  await invoke("hide_walk_picker");
}

export async function submitTargetPicker(
  targetLabel: string,
  mode: TargetPickerMode,
  anchorX: number,
  anchorY: number,
): Promise<void> {
  await invoke("submit_target_picker", { targetLabel, mode, anchorX, anchorY });
}

export async function cancelWalkPicker(targetLabel: string): Promise<void> {
  await invoke("cancel_walk_picker", { targetLabel });
}

export async function listenTargetPickerOpen(
  handler: (payload: TargetPickerOpenPayload) => void,
): Promise<UnlistenFn> {
  return listen<TargetPickerOpenPayload>(TARGET_PICKER_OPEN_EVENT, (event) => {
    handler(event.payload);
  });
}

export async function listenTargetPickerSelected(
  handler: (payload: TargetPickerSelectedPayload) => void,
): Promise<UnlistenFn> {
  return listen<TargetPickerSelectedPayload>(
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
