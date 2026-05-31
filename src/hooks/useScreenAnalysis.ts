import { useCallback, useState } from "react";
import { emitDialogueStart } from "../services/companionDialogue";
import { analyzeScreenActivity } from "../services/screenAnalysisApi";
import type { CompanionBehaviorState } from "../types/companion";

const BLOCKED_SCREEN_ANALYSIS_STATES = new Set<CompanionBehaviorState>([
  "dragging",
  "falling",
  "bouncing",
]);

interface UseScreenAnalysisOptions {
  behaviorState: CompanionBehaviorState;
}

export function useScreenAnalysis({ behaviorState }: UseScreenAnalysisOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlocked = BLOCKED_SCREEN_ANALYSIS_STATES.has(behaviorState);

  const analyzeScreen = useCallback(async () => {
    if (isBlocked || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeScreenActivity();
      await emitDialogueStart(result.description);
    } catch (analysisError) {
      const message =
        typeof analysisError === "string"
          ? analysisError
          : analysisError instanceof Error
            ? analysisError.message
            : "screen analysis failed";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isBlocked]);

  return {
    analyzeScreen,
    isAnalyzing,
    isBlocked,
    error,
  };
}
