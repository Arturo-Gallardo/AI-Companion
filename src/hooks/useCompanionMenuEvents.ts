import { useEffect } from "react";
import { listenCompanionMenuAction } from "../services/companionMenuApi";
import { showWalkPicker } from "../services/companionWalkPickerApi";
import type { CompanionMenuAction } from "../types/companionMenu";

interface UseCompanionMenuEventsOptions {
  onTurnAround: () => void;
  onSit: () => void;
}

function handleMenuAction(
  action: CompanionMenuAction,
  handlers: UseCompanionMenuEventsOptions,
): void {
  switch (action) {
    case "walkTo":
      void showWalkPicker();
      break;
    case "turnAround":
      handlers.onTurnAround();
      break;
    case "sit":
      handlers.onSit();
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
  }, [handlers.onSit, handlers.onTurnAround]);
}
