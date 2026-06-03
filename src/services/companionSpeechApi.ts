import { emitTo } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  COMPANION_SPEECH_ANIMATE_OUT_EVENT,
  COMPANION_SPEECH_ANIMATION_MS,
} from "../constants/companionSpeechAnimation";
import type { ScreenPosition } from "../types/companion";

export const COMPANION_SPEECH_WINDOW_LABEL = "companion-speech";
export const COMPANION_SPEECH_CONTENT_EVENT = "companion-speech-content";
export const COMPANION_SPEECH_DISMISS_EVENT = "companion-speech-dismiss";

export interface CompanionSpeechContentPayload {
  text: string;
  anchorX: number;
  anchorY: number;
}

export async function takeCompanionSpeechContent(): Promise<string | null> {
  return invoke<string | null>("take_companion_speech_content");
}

export async function showCompanionSpeech(
  text: string,
  anchor: ScreenPosition,
): Promise<void> {
  await invoke("show_companion_speech", {
    text,
    anchorX: anchor.x,
    anchorY: anchor.y,
  });
}

export async function hideCompanionSpeech(): Promise<void> {
  await invoke("hide_companion_speech");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

// plays the exit animation in the speech webview before the native window hides
export async function animateOutCompanionSpeech(): Promise<void> {
  await emitTo(
    COMPANION_SPEECH_WINDOW_LABEL,
    COMPANION_SPEECH_ANIMATE_OUT_EVENT,
  );
  await delay(COMPANION_SPEECH_ANIMATION_MS);
}

export async function setCompanionSpeechSize(
  width: number,
  height: number,
): Promise<void> {
  await invoke("set_companion_speech_size", { width, height });
}
