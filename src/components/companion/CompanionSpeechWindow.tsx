import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  COMPANION_SPEECH_CONTENT_EVENT,
  COMPANION_SPEECH_DISMISS_EVENT,
  COMPANION_SPEECH_PLACEMENT_EVENT,
  setCompanionSpeechSize,
  takeCompanionSpeechContent,
  type CompanionSpeechContentPayload,
  type CompanionSpeechPlacementPayload,
} from "../../services/companionSpeechApi";
import { useCompanionSpeechBubbleAnimation } from "../../hooks/useCompanionSpeechBubbleAnimation";
import { CompanionSpeechBubble } from "./CompanionSpeechBubble";
import type { SpeechBubblePlacement } from "../../types/companionSpeech";

export function CompanionSpeechWindow() {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState<string | null>(null);
  const [placement, setPlacement] = useState<SpeechBubblePlacement>("above");
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const { animationClass, stageClassName, canMeasureSize } =
    useCompanionSpeechBubbleAnimation(text, placement);

  useEffect(() => {
    let unlistenContent: (() => void) | undefined;
    let unlistenDismiss: (() => void) | undefined;
    let unlistenPlacement: (() => void) | undefined;
    let cancelled = false;

    async function initSpeechWindow() {
      const pendingText = await takeCompanionSpeechContent();
      if (!cancelled && pendingText) {
        lastSizeRef.current = null;
        setText(pendingText);
      }

      const webview = getCurrentWebviewWindow();

      unlistenContent = await webview.listen<CompanionSpeechContentPayload>(
        COMPANION_SPEECH_CONTENT_EVENT,
        (event) => {
          lastSizeRef.current = null;
          setPlacement(event.payload.placement);
          setText(event.payload.text);
        },
      );

      unlistenDismiss = await webview.listen(
        COMPANION_SPEECH_DISMISS_EVENT,
        () => {
          lastSizeRef.current = null;
          setText(null);
          setPlacement("above");
        },
      );

      unlistenPlacement = await webview.listen<CompanionSpeechPlacementPayload>(
        COMPANION_SPEECH_PLACEMENT_EVENT,
        (event) => {
          setPlacement(event.payload.placement);
        },
      );
    }

    void initSpeechWindow();

    return () => {
      cancelled = true;
      unlistenContent?.();
      unlistenDismiss?.();
      unlistenPlacement?.();
    };
  }, []);

  useLayoutEffect(() => {
    if (text === null || !canMeasureSize) {
      return;
    }

    const node = bubbleRef.current;
    if (!node) {
      return;
    }

    const syncSize = () => {
      const width = node.offsetWidth;
      const height = node.offsetHeight;

      if (width === 0 || height === 0) {
        return;
      }

      const lastSize = lastSizeRef.current;
      if (lastSize?.width === width && lastSize?.height === height) {
        return;
      }

      lastSizeRef.current = { width, height };
      void setCompanionSpeechSize(width, height);
    };

    syncSize();

    const observer = new ResizeObserver(() => {
      syncSize();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [text, canMeasureSize]);

  if (text === null) {
    return null;
  }

  return (
    <div
      ref={bubbleRef}
      className={`${stageClassName} inline-flex justify-center overflow-hidden`}
      style={{ width: "max-content", maxWidth: 128 }}
    >
      <div className={animationClass}>
        <CompanionSpeechBubble text={text} />
      </div>
    </div>
  );
}
