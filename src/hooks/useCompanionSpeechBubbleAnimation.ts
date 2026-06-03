import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import {
  COMPANION_SPEECH_ANIMATE_OUT_EVENT,
  COMPANION_SPEECH_ANIMATION_MS,
} from "../constants/companionSpeechAnimation";

export type CompanionSpeechAnimationPhase =
  | "hidden"
  | "entering"
  | "visible"
  | "exiting";

interface UseCompanionSpeechBubbleAnimationResult {
  animationClass: string | undefined;
  canMeasureSize: boolean;
}

export function useCompanionSpeechBubbleAnimation(
  text: string | null,
): UseCompanionSpeechBubbleAnimationResult {
  const [phase, setPhase] = useState<CompanionSpeechAnimationPhase>("hidden");

  useEffect(() => {
    if (text === null) {
      setPhase("hidden");
      return;
    }

    setPhase("entering");

    const enterTimerId = window.setTimeout(() => {
      setPhase("visible");
    }, COMPANION_SPEECH_ANIMATION_MS);

    return () => {
      window.clearTimeout(enterTimerId);
    };
  }, [text]);

  useEffect(() => {
    let unlistenAnimateOut: (() => void) | undefined;
    let cancelled = false;

    async function listenForAnimateOut() {
      const webview = getCurrentWebviewWindow();

      unlistenAnimateOut = await webview.listen(
        COMPANION_SPEECH_ANIMATE_OUT_EVENT,
        () => {
          if (cancelled) {
            return;
          }

          setPhase("exiting");
        },
      );
    }

    void listenForAnimateOut();

    return () => {
      cancelled = true;
      unlistenAnimateOut?.();
    };
  }, []);

  const animationClass =
    phase === "entering"
      ? "companion-speech-bubble-enter"
      : phase === "exiting"
        ? "companion-speech-bubble-exit"
        : undefined;

  const canMeasureSize = phase === "visible" || phase === "exiting";

  return { animationClass, canMeasureSize };
}
