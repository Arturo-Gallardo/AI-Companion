import { useEffect, useState } from "react";
import { listenCompanionBackgroundMode } from "../services/companionBackground";
import type { CompanionBackgroundMode } from "../types/companionBackground";

export function useCompanionBackgroundEvents(): CompanionBackgroundMode {
  const [mode, setMode] = useState<CompanionBackgroundMode>("transparent");

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    void listenCompanionBackgroundMode((nextMode) => {
      setMode(nextMode);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return mode;
}
