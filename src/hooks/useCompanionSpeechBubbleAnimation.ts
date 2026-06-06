import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import {
  COMPANION_SPEECH_ANIMATE_OUT_EVENT,
  COMPANION_SPEECH_ANIMATION_MS,
} from "../constants/companionSpeechAnimation";
import type { SpeechBubblePlacement } from "../types/companionSpeech";

export type CompanionSpeechAnimationPhase =
  | "hidden"
  | "entering"
  | "visible"
  | "exiting";

interface UseCompanionSpeechBubbleAnimationResult {
  animationClass: string | undefined;
  stageClassName: string;
  canMeasureSize: boolean;
}

function getStageClassName(placement: SpeechBubblePlacement): string {
  return `companion-speech-bubble-stage companion-speech-bubble-stage--${placement}`;
}

function getAnimationClass(
  phase: CompanionSpeechAnimationPhase,
  placement: SpeechBubblePlacement,
): string | undefined {
  if (phase === "entering") {
    return `companion-speech-bubble-enter companion-speech-bubble-enter--${placement}`;
  }

  if (phase === "exiting") {
    return `companion-speech-bubble-exit companion-speech-bubble-exit--${placement}`;
  }

  return undefined;
}

export function useCompanionSpeechBubbleAnimation(
  text: string | null,
  placement: SpeechBubblePlacement,
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

  const animationClass = getAnimationClass(phase, placement);
  const stageClassName = getStageClassName(placement);

  // measure as soon as text is on screen so the native window resizes before
  // the 32px initial size can flash scrollbars
  const canMeasureSize =
    phase === "entering" || phase === "visible" || phase === "exiting";

  return { animationClass, stageClassName, canMeasureSize };
}
