import { useEffect } from "react";
import { getDesktopBounds } from "../../services/companionApi";
import {
  cancelWalkPicker,
  submitWalkPickerTarget,
} from "../../services/companionWalkPickerApi";
import type { DesktopBounds } from "../../types/companion";

function toAnchorX(clientX: number, bounds: DesktopBounds): number {
  return bounds.virtualLeft + clientX;
}

export function WalkPickerWindow() {
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
    const anchorX = toAnchorX(event.clientX, bounds);
    void submitWalkPickerTarget(anchorX);
  };

  return (
    <div
      role="presentation"
      className="h-full w-full cursor-crosshair bg-black/10"
      onPointerDown={(event) => {
        void handlePointerDown(event);
      }}
    />
  );
}
