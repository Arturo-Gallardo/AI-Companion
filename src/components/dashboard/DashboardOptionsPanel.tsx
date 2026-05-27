import { emitDialogueStart } from "../../services/companionDialogue";
import { useCompanionMirrorState } from "../../hooks/useCompanionMirrorState";

const TEST_DIALOGUE_TEXT = "hello";

const BLOCKED_DIALOGUE_STATES = new Set([
  "dragging",
  "falling",
  "bouncing",
  "dialoguing",
]);

export function DashboardOptionsPanel() {
  const mirrorState = useCompanionMirrorState();
  const isDialogueBlocked = BLOCKED_DIALOGUE_STATES.has(mirrorState.behaviorState);

  const handleDialogueClick = () => {
    if (isDialogueBlocked) {
      return;
    }

    void emitDialogueStart(TEST_DIALOGUE_TEXT);
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

          {["Option 2", "Option 3", "Option 4"].map((label) => (
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
