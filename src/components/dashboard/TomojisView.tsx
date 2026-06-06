import { useState } from "react";
import { useCompanionInstances } from "../../hooks/useCompanionInstances";
import { ShimejiImportWizard } from "../wizard/ShimejiImportWizard";
import { TomojiImportScreen } from "../import/TomojiImportScreen";
import { AddTomojiCard } from "./AddTomojiCard";
import { AddTomojiModal } from "./AddTomojiModal";
import { CharacterSettingsEditor } from "./CharacterSettingsEditor";
import { TomojiCard } from "./TomojiCard";

type TomojiFlow = "list" | "add" | "importTomoji" | "importShimeji" | "edit";

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

  // a freshly imported character becomes a live companion right away
  const handleImported = async (characterId: string) => {
    await addCompanion(characterId);
    setFlow("list");
  };

  if (flow === "edit" && editingInstance) {
    return (
      <CharacterSettingsEditor
        instance={editingInstance}
        onClose={() => setFlow("list")}
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
    <section className="relative min-h-0 flex-1 overflow-y-auto px-12 py-12">
      <div className="flex flex-wrap gap-6">
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
    </section>
  );
}
