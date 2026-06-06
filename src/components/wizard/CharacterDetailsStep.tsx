import { useState } from "react";
import type { ShimejiDraftController } from "../../hooks/useShimejiDraft";

interface CharacterDetailsStepProps {
  controller: ShimejiDraftController;
}

export function CharacterDetailsStep({ controller }: CharacterDetailsStepProps) {
  const {
    draft,
    setName,
    addDialogueLine,
    removeDialogueLine,
    setDialogueFrequency,
    patchBehavior,
    setScale,
    setSpeed,
  } = controller;
  const [lineDraft, setLineDraft] = useState("");

  const submitLine = () => {
    addDialogueLine(lineDraft);
    setLineDraft("");
  };

  return (
    <div className="grid max-w-3xl grid-cols-2 gap-8">
      <div className="space-y-5">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Name
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My Tomoji"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Movement speed: {draft.speed.toFixed(1)} px/tick
          </span>
          <input
            type="range"
            min={0.5}
            max={6}
            step={0.5}
            value={draft.speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Scale: {draft.scale.toFixed(2)}x
          </span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={draft.scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Action frequency: {Math.round(draft.behavior.actionFrequency * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.behavior.actionFrequency}
            onChange={(event) =>
              patchBehavior({ actionFrequency: Number(event.target.value) })
            }
            className="mt-1 w-full"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Dialogue lines
          </span>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={lineDraft}
              onChange={(event) => setLineDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitLine();
                }
              }}
              placeholder="Add a line..."
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
            <button
              type="button"
              onClick={submitLine}
              className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black"
            >
              Add
            </button>
          </div>

          <ul className="mt-3 flex max-h-[180px] flex-col gap-1 overflow-y-auto">
            {draft.dialogueLines.map((line, index) => (
              <li
                key={`${line}-${index}`}
                className="flex items-center justify-between rounded border border-neutral-800 px-2 py-1 text-sm text-neutral-200"
              >
                <span className="truncate">{line}</span>
                <button
                  type="button"
                  onClick={() => removeDialogueLine(index)}
                  className="px-1 text-red-300 hover:text-red-200"
                  aria-label="Remove line"
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Dialogue frequency: {Math.round(draft.dialogueFrequency * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.dialogueFrequency}
            onChange={(event) =>
              setDialogueFrequency(Number(event.target.value))
            }
            className="mt-1 w-full"
          />
        </label>
      </div>
    </div>
  );
}
