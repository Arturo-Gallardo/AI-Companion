import { useState } from "react";
import { TomojiPageHeader } from "../dashboard/TomojiPageHeader";
import { TomojiPageLayout } from "../dashboard/TomojiPageLayout";
import {
  importTomojiFromFolder,
  type TomojiImportResult,
} from "../../services/tomojiImporter";

interface TomojiImportScreenProps {
  onClose: () => void;
  onImported: (characterId: string) => void | Promise<void>;
}

export function TomojiImportScreen({
  onClose,
  onImported,
}: TomojiImportScreenProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<TomojiImportResult | null>(null);

  const handleChooseFolder = async () => {
    setIsImporting(true);
    setResult(null);
    try {
      const outcome = await importTomojiFromFolder();
      if (outcome === null) {
        return;
      }

      setResult(outcome);
      if (outcome.ok && outcome.characterId) {
        await onImported(outcome.characterId);
      }
    } catch (error) {
      setResult({
        ok: false,
        errors: [error instanceof Error ? error.message : "import failed"],
        warnings: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <TomojiPageLayout
      header={
        <TomojiPageHeader title="Import Tomoji" onBack={onClose} />
      }
    >
      <p className="mb-8 max-w-xl text-sm leading-relaxed text-neutral-400">
        Select a Tomoji character folder. It must contain a
        <code className="mx-1 rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-200">
          manifest.json
        </code>
        and the sprite files it references.
      </p>

      <button
        type="button"
        disabled={isImporting}
        onClick={handleChooseFolder}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {isImporting ? "Importing..." : "Choose folder"}
      </button>

      {result ? (
        <div className="mt-8 max-w-xl space-y-3">
          {result.ok ? (
            <p className="rounded-lg border border-green-600/50 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              Imported successfully.
            </p>
          ) : null}

          {result.errors.length > 0 ? (
            <ul className="rounded-lg border border-red-600/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {result.errors.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          ) : null}

          {result.warnings.length > 0 ? (
            <ul className="rounded-lg border border-yellow-600/40 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
              {result.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </TomojiPageLayout>
  );
}
