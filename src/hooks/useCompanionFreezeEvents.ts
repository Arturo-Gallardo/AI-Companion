import { useEffect } from "react";
import { listenFreezeToggle } from "../services/companionFreeze";

interface UseCompanionFreezeEventsOptions {
  toggleFreeze: () => void;
}

export function useCompanionFreezeEvents({
  toggleFreeze,
}: UseCompanionFreezeEventsOptions): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenFreezeToggle(() => {
      toggleFreeze();
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [toggleFreeze]);
}
