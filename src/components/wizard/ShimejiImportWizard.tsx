import { useState } from "react";
import { useShimejiDraft } from "../../hooks/useShimejiDraft";
import { convertShimejiDraft } from "../../services/shimejiImporter";
import { AssignAnimationsStep } from "./AssignAnimationsStep";
import { CharacterDetailsStep } from "./CharacterDetailsStep";
import { FinalPreviewStep } from "./FinalPreviewStep";
import { SelectImgFolderStep } from "./SelectImgFolderStep";

interface ShimejiImportWizardProps {
  onClose: () => void;
  onImported: (characterId: string) => void | Promise<void>;
}

const STEP_TITLES = [
  "Select frames",
  "Assign animations",
  "Details",
  "Preview",
] as const;

export function ShimejiImportWizard({
  onClose,
  onImported,
}: ShimejiImportWizardProps) {
  const controller = useShimejiDraft();
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { draft } = controller;
  const hasSources = draft.imgDir !== null && draft.sources.length > 0;
  const hasIdleFrames = draft.assignments.idle.frames.length > 0;

  const canProceed =
    step === 0 ? hasSources : step === 1 ? hasIdleFrames : true;
  const isLastStep = step === STEP_TITLES.length - 1;

  const handleFinish = async () => {
    setIsFinishing(true);
    setError(null);
    try {
      const characterId = await convertShimejiDraft(draft);
      await onImported(characterId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "conversion failed");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col px-12 py-8">
      <header className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
        >
          Cancel
        </button>
        <h1 className="text-xl font-bold text-white">Import Shimeji</h1>
        <div className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
          {STEP_TITLES.map((title, index) => (
            <span
              key={title}
              className={`rounded-full px-2.5 py-1 ${
                index === step
                  ? "bg-white text-black"
                  : index < step
                    ? "text-white"
                    : "text-neutral-500"
              }`}
            >
              {index + 1}. {title}
            </span>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        {step === 0 ? <SelectImgFolderStep controller={controller} /> : null}
        {step === 1 ? <AssignAnimationsStep controller={controller} /> : null}
        {step === 2 ? <CharacterDetailsStep controller={controller} /> : null}
        {step === 3 ? <FinalPreviewStep controller={controller} /> : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-600/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <footer className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 disabled:opacity-40"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={() => void handleFinish()}
            disabled={isFinishing || !hasIdleFrames}
            className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {isFinishing ? "Creating..." : "Create Tomoji"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((current) => current + 1)}
            disabled={!canProceed}
            className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            Next
          </button>
        )}
      </footer>
    </section>
  );
}
