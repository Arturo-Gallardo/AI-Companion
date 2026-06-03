import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  COMPANION_SPEECH_CONTENT_EVENT,
  COMPANION_SPEECH_DISMISS_EVENT,
  setCompanionSpeechSize,
  takeCompanionSpeechContent,
  type CompanionSpeechContentPayload,
} from "../../services/companionSpeechApi";
import { useCompanionSpeechBubbleAnimation } from "../../hooks/useCompanionSpeechBubbleAnimation";
import { CompanionSpeechBubble } from "./CompanionSpeechBubble";

export function CompanionSpeechWindow() {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState<string | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const { animationClass, canMeasureSize } =
    useCompanionSpeechBubbleAnimation(text);

  useEffect(() => {
    let unlistenContent: (() => void) | undefined;
    let unlistenDismiss: (() => void) | undefined;
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
          setText(event.payload.text);
        },
      );

      unlistenDismiss = await webview.listen(
        COMPANION_SPEECH_DISMISS_EVENT,
        () => {
          lastSizeRef.current = null;
          setText(null);
        },
      );
    }

    void initSpeechWindow();

    return () => {
      cancelled = true;
      unlistenContent?.();
      unlistenDismiss?.();
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
      className="companion-speech-bubble-stage inline-flex justify-center"
      style={{ width: "max-content", maxWidth: 128 }}
    >
      <div className={animationClass}>
        <CompanionSpeechBubble text={text} />
      </div>
    </div>
  );
}
