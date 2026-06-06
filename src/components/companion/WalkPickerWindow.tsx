import { useEffect, useState } from "react";
import { getDesktopBounds } from "../../services/companionApi";
import {
  cancelWalkPicker,
  listenTargetPickerOpen,
  submitTargetPicker,
} from "../../services/companionWalkPickerApi";
import type { DesktopBounds } from "../../types/companion";
import type { TargetPickerMode } from "../../types/companionMenu";

function toAnchorX(clientX: number, bounds: DesktopBounds): number {
  return bounds.virtualLeft + clientX;
}

function toAnchorY(clientY: number, bounds: DesktopBounds): number {
  return bounds.virtualTop + clientY;
}

export function WalkPickerWindow() {
  const [mode, setMode] = useState<TargetPickerMode>("walk");
  // the companion window that opened this picker; picker results route back to it
  const [targetLabel, setTargetLabel] = useState<string | null>(null);

  useEffect(() => {
    let unlistenOpen: (() => void) | undefined;

    void listenTargetPickerOpen(({ mode: nextMode, targetLabel: nextTarget }) => {
      setMode(nextMode);
      setTargetLabel(nextTarget);
    }).then((cleanup) => {
      unlistenOpen = cleanup;
    });

    return () => {
      unlistenOpen?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && targetLabel !== null) {
        void cancelWalkPicker(targetLabel);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetLabel]);

  const handlePointerDown = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (targetLabel === null) {
      return;
    }

    if (event.button !== 0) {
      if (event.button === 2) {
        void cancelWalkPicker(targetLabel);
      }
      return;
    }

    const bounds = await getDesktopBounds();

    if (mode === "climb") {
      const anchorY = toAnchorY(event.clientY, bounds);
      void submitTargetPicker(targetLabel, "climb", 0, anchorY);
      return;
    }

    const anchorX = toAnchorX(event.clientX, bounds);
    void submitTargetPicker(
      targetLabel,
      mode === "crawl" ? "crawl" : "walk",
      anchorX,
      0,
    );
  };

  const cursorClass =
    mode === "climb"
      ? "cursor-ns-resize"
      : mode === "crawl"
        ? "cursor-ew-resize"
        : "cursor-crosshair";

  return (
    <div
      role="presentation"
      className={`h-full w-full bg-black/10 ${cursorClass}`}
      onPointerDown={(event) => {
        void handlePointerDown(event);
      }}
    />
  );
}
