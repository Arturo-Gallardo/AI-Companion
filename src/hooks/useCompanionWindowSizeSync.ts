import { useEffect, useRef } from "react";
import type { AnimationRegistry } from "../services/animationRegistry";
import { setCompanionWindowSize } from "../services/companionApi";
import type { AnchorClampMode, ScreenPosition } from "../types/companion";
import type { CompanionInstance } from "../types/companionInstance";

interface UseCompanionWindowSizeSyncOptions {
  instance: CompanionInstance;
  registry: AnimationRegistry;
  isReady: boolean;
  getAnchorPosition: () => ScreenPosition;
  setAnchorPosition: (
    position: ScreenPosition,
    mode?: AnchorClampMode,
  ) => Promise<void>;
}

// keeps the native companion window sized to the scaled sprite and reclamps
// position when scale or frame dimensions change from the edit screen.
export function useCompanionWindowSizeSync({
  instance,
  registry,
  isReady,
  getAnchorPosition,
  setAnchorPosition,
}: UseCompanionWindowSizeSyncOptions): void {
  const lastSizeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const width = registry.spriteWidth * instance.scale;
    const height = registry.spriteHeight * instance.scale;
    const sizeKey = `${width}x${height}`;

    if (lastSizeKeyRef.current === sizeKey) {
      return;
    }

    lastSizeKeyRef.current = sizeKey;

    void (async () => {
      await setCompanionWindowSize(width, height);

      const anchor = getAnchorPosition();
      await setAnchorPosition(anchor, "grounded");
    })();
  }, [
    getAnchorPosition,
    instance.scale,
    isReady,
    registry.spriteHeight,
    registry.spriteWidth,
    setAnchorPosition,
  ]);
}
