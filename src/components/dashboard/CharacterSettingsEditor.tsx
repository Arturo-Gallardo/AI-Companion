import { useState } from "react";
import type { CompanionInstance } from "../../types/companionInstance";

interface CharacterSettingsEditorProps {
  instance: CompanionInstance;
  onClose: () => void;
  onSave: (
    id: string,
    patch: Partial<Omit<CompanionInstance, "id">>,
  ) => Promise<void>;
}

// edits a single companion's per-instance config. scale/speed changes apply the
// next time the Tomoji is toggled off and on (the window keeps its spawn size).
export function CharacterSettingsEditor({
  instance,
  onClose,
  onSave,
}: CharacterSettingsEditorProps) {
  const [name, setName] = useState(instance.name);
  const [scale, setScale] = useState(instance.scale);
  const [behavior, setBehavior] = useState(instance.behaviorSettings);
  const [dialogue, setDialogue] = useState(instance.dialogueSettings);
  const [lineDraft, setLineDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addLine = () => {
    const trimmed = lineDraft.trim();
    if (trimmed === "") {
      return;
    }
    setDialogue((current) => ({
      ...current,
      lines: [...current.lines, trimmed],
    }));
    setLineDraft("");
  };

  const removeLine = (index: number) => {
    setDialogue((current) => ({
      ...current,
      lines: current.lines.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(instance.id, {
        name,
        scale,
        behaviorSettings: behavior,
        dialogueSettings: dialogue,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-12 py-10">
      <header className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
        >
          Back
        </button>
        <h1 className="text-xl font-bold text-white">Edit {instance.name}</h1>
      </header>

      <div className="grid max-w-3xl grid-cols-2 gap-8">
        <div className="space-y-5">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Scale: {scale.toFixed(2)}x
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Movement speed: {behavior.movementSpeed.toFixed(2)}x
            </span>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.1}
              value={behavior.movementSpeed}
              onChange={(event) =>
                setBehavior((current) => ({
                  ...current,
                  movementSpeed: Number(event.target.value),
                }))
              }
              className="mt-1 w-full"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Action frequency: {Math.round(behavior.actionFrequency * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={behavior.actionFrequency}
              onChange={(event) =>
                setBehavior((current) => ({
                  ...current,
                  actionFrequency: Number(event.target.value),
                }))
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
                    addLine();
                  }
                }}
                placeholder="Add a line..."
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={addLine}
                className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-black"
              >
                Add
              </button>
            </div>

            <ul className="mt-3 flex max-h-[160px] flex-col gap-1 overflow-y-auto">
              {dialogue.lines.map((line, index) => (
                <li
                  key={`${line}-${index}`}
                  className="flex items-center justify-between rounded border border-neutral-800 px-2 py-1 text-sm text-neutral-200"
                >
                  <span className="truncate">{line}</span>
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
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
              Dialogue frequency: {Math.round(dialogue.frequency * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={dialogue.frequency}
              onChange={(event) =>
                setDialogue((current) => ({
                  ...current,
                  frequency: Number(event.target.value),
                }))
              }
              className="mt-1 w-full"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <p className="text-xs text-neutral-500">
          Scale changes apply after toggling the Tomoji off and on.
        </p>
      </div>
    </section>
  );
}
