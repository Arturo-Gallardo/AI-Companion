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

  useEffect(() => {
    let unlistenOpen: (() => void) | undefined;

    void listenTargetPickerOpen(({ mode: nextMode }) => {
      setMode(nextMode);
    }).then((cleanup) => {
      unlistenOpen = cleanup;
    });

    return () => {
      unlistenOpen?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void cancelWalkPicker();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handlePointerDown = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      if (event.button === 2) {
        void cancelWalkPicker();
      }
      return;
    }

    const bounds = await getDesktopBounds();

    if (mode === "climb") {
      const anchorY = toAnchorY(event.clientY, bounds);
      void submitTargetPicker("climb", 0, anchorY);
      return;
    }

    const anchorX = toAnchorX(event.clientX, bounds);
    void submitTargetPicker("walk", anchorX, 0);
  };

  const cursorClass = mode === "climb" ? "cursor-ns-resize" : "cursor-crosshair";

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
