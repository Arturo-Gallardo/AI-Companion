import { useCallback, useState } from "react";
import { emitCompanionBackgroundMode } from "../services/companionBackground";
import type { CompanionBackgroundMode } from "../types/companionBackground";

interface UseCompanionBackgroundToggleResult {
  mode: CompanionBackgroundMode;
  toggleLabel: string;
  cycleMode: () => void;
}

// debug-only dashboard toggle; not persisted and not exposed in settings
export function useCompanionBackgroundToggle(): UseCompanionBackgroundToggleResult {
  const [mode, setMode] = useState<CompanionBackgroundMode>("transparent");

  const cycleMode = useCallback(() => {
    const nextMode: CompanionBackgroundMode =
      mode === "transparent" ? "gray" : "transparent";

    setMode(nextMode);
    void emitCompanionBackgroundMode(nextMode);
  }, [mode]);

  const toggleLabel = mode === "transparent" ? "Gray bg" : "Clear bg";

  return {
    mode,
    toggleLabel,
    cycleMode,
  };
}
