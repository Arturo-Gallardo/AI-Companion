import { useEffect } from "react";
import { listenCompanionMenuAction } from "../services/companionMenuApi";
import { showTargetPicker } from "../services/companionWalkPickerApi";
import type { CompanionMenuAction } from "../types/companionMenu";

interface UseCompanionMenuEventsOptions {
  onTurnAround: () => void;
  onSit: () => void;
  onToggleFreeze: () => void;
  onUnfreeze: () => void;
}

function handleMenuAction(
  action: CompanionMenuAction,
  handlers: UseCompanionMenuEventsOptions,
): void {
  switch (action) {
    case "walkTo":
      handlers.onUnfreeze();
      void showTargetPicker("walk");
      break;
    case "climbTo":
      handlers.onUnfreeze();
      void showTargetPicker("climb");
      break;
    case "turnAround":
      handlers.onTurnAround();
      break;
    case "sit":
      handlers.onSit();
      break;
    case "toggleFreeze":
      handlers.onToggleFreeze();
      break;
    default:
      break;
  }
}

export function useCompanionMenuEvents(
  handlers: UseCompanionMenuEventsOptions,
): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenCompanionMenuAction((payload) => {
      handleMenuAction(payload.action, handlers);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [handlers.onSit, handlers.onToggleFreeze, handlers.onTurnAround, handlers.onUnfreeze]);
}
