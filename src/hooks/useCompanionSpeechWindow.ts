import { useEffect, useRef } from "react";
import {
  animateOutCompanionSpeech,
  hideCompanionSpeech,
  showCompanionSpeech,
} from "../services/companionSpeechApi";
import type { ScreenPosition } from "../types/companion";

interface UseCompanionSpeechWindowOptions {
  dialogueText: string | null;
  getAnchorPosition: () => ScreenPosition;
  isReady: boolean;
}

export function useCompanionSpeechWindow({
  dialogueText,
  getAnchorPosition,
  isReady,
}: UseCompanionSpeechWindowOptions): void {
  const getAnchorPositionRef = useRef(getAnchorPosition);
  const activeDialogueRef = useRef<string | null>(null);

  useEffect(() => {
    getAnchorPositionRef.current = getAnchorPosition;
  }, [getAnchorPosition]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let cancelled = false;

    async function syncSpeechWindow() {
      if (dialogueText === null) {
        if (activeDialogueRef.current === null) {
          return;
        }

        activeDialogueRef.current = null;

        try {
          await animateOutCompanionSpeech();
          await hideCompanionSpeech();
        } catch {
          // ignore hide failures while tearing down
        }

        return;
      }

      if (activeDialogueRef.current === dialogueText) {
        return;
      }

      activeDialogueRef.current = dialogueText;
      const anchor = getAnchorPositionRef.current();

      try {
        await showCompanionSpeech(dialogueText, anchor);
      } catch (error) {
        console.error("failed to show companion speech window", error);
        if (!cancelled) {
          activeDialogueRef.current = null;
        }
      }
    }

    void syncSpeechWindow();

    return () => {
      cancelled = true;
    };
  }, [dialogueText, isReady]);
}
