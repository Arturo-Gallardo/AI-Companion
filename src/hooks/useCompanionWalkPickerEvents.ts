import { useEffect } from "react";
import {
  listenWalkPickerCancel,
  listenWalkPickerSelected,
} from "../services/companionWalkPickerApi";

interface UseCompanionWalkPickerEventsOptions {
  onSelectTarget: (anchorX: number) => void;
  onCancel: () => void;
}

export function useCompanionWalkPickerEvents({
  onSelectTarget,
  onCancel,
}: UseCompanionWalkPickerEventsOptions): void {
  useEffect(() => {
    let unlistenSelect: (() => void) | undefined;
    let unlistenCancel: (() => void) | undefined;

    void listenWalkPickerSelected(({ anchorX }) => {
      onSelectTarget(anchorX);
    }).then((cleanup) => {
      unlistenSelect = cleanup;
    });

    void listenWalkPickerCancel(() => {
      onCancel();
    }).then((cleanup) => {
      unlistenCancel = cleanup;
    });

    return () => {
      unlistenSelect?.();
      unlistenCancel?.();
    };
  }, [onCancel, onSelectTarget]);
}
