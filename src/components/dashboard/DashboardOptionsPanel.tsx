import { emitDialogueStart } from "../../services/companionDialogue";
import { emitFreezeToggle } from "../../services/companionFreeze";
import { emitSitToggle } from "../../services/companionSit";
import { useCompanionMirrorState } from "../../hooks/useCompanionMirrorState";
import { pickRandomMotivationalQuote } from "../../utils/pickRandomQuote";

const BLOCKED_COMPANION_COMMAND_STATES = new Set([
  "dragging",
  "falling",
  "bouncing",
  "climbing",
]);

export function DashboardOptionsPanel() {
  const mirrorState = useCompanionMirrorState();
  const isCommandBlocked = BLOCKED_COMPANION_COMMAND_STATES.has(
    mirrorState.behaviorState,
  );
  const isSitting = mirrorState.behaviorState === "sitting";
  const canToggleSit = isSitting || !isCommandBlocked;
  const isFrozen = mirrorState.isFrozen;

  const handleDialogueClick = () => {
    if (isCommandBlocked) {
      return;
    }

    void emitDialogueStart(pickRandomMotivationalQuote());
  };

  const handleSitClick = () => {
    if (!canToggleSit) {
      return;
    }

    void emitSitToggle();
  };

  const handleFreezeClick = () => {
    void emitFreezeToggle();
  };

  return (
    <section className="flex h-full min-h-0 items-center justify-center p-8">
      <div className="flex h-full w-full max-w-sm flex-col rounded-lg border-2 border-neutral-600/80 p-6">
        <div className="flex flex-1 flex-col justify-evenly gap-4">
          <button
            type="button"
            onClick={handleDialogueClick}
            disabled={isCommandBlocked}
            className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 enabled:hover:border-neutral-400/80 enabled:hover:text-white disabled:cursor-default disabled:opacity-50"
          >
            Dialogue
          </button>

          <button
            type="button"
            onClick={handleSitClick}
            disabled={!canToggleSit}
            className={`flex flex-1 items-center justify-center rounded-md border-2 text-lg text-neutral-200 enabled:hover:border-neutral-400/80 enabled:hover:text-white disabled:cursor-default disabled:opacity-50 ${
              isSitting
                ? "border-neutral-400/90 text-white"
                : "border-neutral-600/70"
            }`}
          >
            {isSitting ? "Stand" : "Sit"}
          </button>

          <button
            type="button"
            onClick={handleFreezeClick}
            className={`flex flex-1 items-center justify-center rounded-md border-2 text-lg text-neutral-200 hover:border-neutral-400/80 hover:text-white ${
              isFrozen
                ? "border-neutral-400/90 text-white"
                : "border-neutral-600/70"
            }`}
          >
            {isFrozen ? "Unfreeze" : "Freeze"}
          </button>

          <button
            type="button"
            disabled
            className="flex flex-1 items-center justify-center rounded-md border-2 border-neutral-600/70 text-lg text-neutral-200 disabled:cursor-default"
          >
            Mute
          </button>
        </div>
      </div>
    </section>
  );
}
