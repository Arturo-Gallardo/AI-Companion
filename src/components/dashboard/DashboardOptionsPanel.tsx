import { emitDialogueStart } from "../../services/companionDialogue";
import { useCompanionMirrorState } from "../../hooks/useCompanionMirrorState";
import { useScreenAnalysis } from "../../hooks/useScreenAnalysis";
import { pickRandomMotivationalQuote } from "../../utils/pickRandomQuote";

const BLOCKED_DIALOGUE_STATES = new Set(["dragging", "falling", "bouncing"]);

export function DashboardOptionsPanel() {
  const mirrorState = useCompanionMirrorState();
  const isDialogueBlocked = BLOCKED_DIALOGUE_STATES.has(mirrorState.behaviorState);
  const { analyzeScreen, isAnalyzing, isBlocked, error } = useScreenAnalysis({
    behaviorState: mirrorState.behaviorState,
  });

  const handleDialogueClick = () => {
    if (isDialogueBlocked) {
      return;
    }

    void emitDialogueStart(pickRandomMotivationalQuote());
  };

  const handleAnalyzeScreenClick = () => {
    void analyzeScreen();
  };

  return (
    <section className="flex h-full min-h-0 items-center justify-center p-8">
      <div className="flex h-full w-full max-w-sm flex-col rounded-lg border-2 border-neutral-600/80 p-6">
        <div className="flex flex-1 flex-col justify-evenly gap-4">
          <button
            type="button"
            onClick={handleDialogueClick}
            disabled={isDialogueBlocked}
            className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 enabled:hover:border-neutral-400/80 enabled:hover:text-white disabled:cursor-default disabled:opacity-50"
          >
            Dialogue
          </button>

          <button
            type="button"
            onClick={handleAnalyzeScreenClick}
            disabled={isBlocked || isAnalyzing}
            className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 enabled:hover:border-neutral-400/80 enabled:hover:text-white disabled:cursor-default disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze screen"}
          </button>

          {error !== null ? (
            <p className="text-center text-sm text-red-400">{error}</p>
          ) : null}

          {["Option 3", "Option 4"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 disabled:cursor-default"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
