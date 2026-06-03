import { useEffect } from "react";
import { listenSitToggle } from "../services/companionSit";

interface UseCompanionSitEventsOptions {
  toggleSit: () => void;
}

export function useCompanionSitEvents({
  toggleSit,
}: UseCompanionSitEventsOptions): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenSitToggle(() => {
      toggleSit();
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, [toggleSit]);
}
