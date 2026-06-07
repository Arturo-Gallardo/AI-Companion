import { useState } from "react";
import { useCompanionInstances } from "../../hooks/useCompanionInstances";
import { openCharactersFolder } from "../../services/tomojiStorage";
import { ShimejiImportWizard } from "../wizard/ShimejiImportWizard";
import { TomojiImportScreen } from "../import/TomojiImportScreen";
import { AddTomojiCard } from "./AddTomojiCard";
import { AddTomojiModal } from "./AddTomojiModal";
import { CharacterFrameEditor } from "./CharacterFrameEditor";
import { CharacterSettingsEditor } from "./CharacterSettingsEditor";
import { TomojiCard } from "./TomojiCard";
import { TomojiPageHeader } from "./TomojiPageHeader";
import { TomojiPageLayout } from "./TomojiPageLayout";

type TomojiFlow =
  | "list"
  | "add"
  | "importTomoji"
  | "importShimeji"
  | "edit"
  | "editFrames";

export function TomojisView() {
  const {
    instances,
    addCompanion,
    removeCompanion,
    toggleCompanion,
    updateCompanion,
  } = useCompanionInstances();
  const [flow, setFlow] = useState<TomojiFlow>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingInstance = instances.find((instance) => instance.id === editingId);

  const handleImported = async (characterId: string) => {
    await addCompanion(characterId);
    setFlow("list");
  };

  if (flow === "editFrames" && editingInstance) {
    return (
      <CharacterFrameEditor
        characterId={editingInstance.characterId}
        characterName={editingInstance.name}
        onClose={() => setFlow("edit")}
        onSaved={() => setFlow("edit")}
      />
    );
  }

  if (flow === "edit" && editingInstance) {
    return (
      <CharacterSettingsEditor
        instance={editingInstance}
        onClose={() => setFlow("list")}
        onEditFrames={() => setFlow("editFrames")}
        onSave={updateCompanion}
      />
    );
  }

  if (flow === "importTomoji") {
    return (
      <TomojiImportScreen
        onClose={() => setFlow("list")}
        onImported={handleImported}
      />
    );
  }

  if (flow === "importShimeji") {
    return (
      <ShimejiImportWizard
        onClose={() => setFlow("list")}
        onImported={handleImported}
      />
    );
  }

  return (
    <TomojiPageLayout
      header={
        <TomojiPageHeader
          title="Your Tomojis"
          trailing={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void openCharactersFolder()}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
              >
                Open Tomojis folder
              </button>
              <p className="text-sm text-neutral-400">
                {instances.length} companion{instances.length === 1 ? "" : "s"}
              </p>
            </div>
          }
        />
      }
    >
      <p className="mb-8 max-w-xl text-sm text-neutral-400">
        Toggle companions on or off, edit behavior, or import new characters.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-8">
        {instances.map((instance) => (
          <TomojiCard
            key={instance.id}
            instance={instance}
            onDelete={removeCompanion}
            onToggle={toggleCompanion}
            onEdit={(id) => {
              setEditingId(id);
              setFlow("edit");
            }}
          />
        ))}

        <AddTomojiCard onAdd={() => setFlow("add")} />
      </div>

      {flow === "add" ? (
        <AddTomojiModal
          onClose={() => setFlow("list")}
          onCreateNew={() => setFlow("list")}
          onImportTomoji={() => setFlow("importTomoji")}
          onImportShimeji={() => setFlow("importShimeji")}
        />
      ) : null}
    </TomojiPageLayout>
  );
}
