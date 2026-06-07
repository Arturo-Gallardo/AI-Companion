import { useState } from "react";
import { useCompanionInstances } from "../../hooks/useCompanionInstances";
import { openCharactersFolder } from "../../services/tomojiStorage";
import { ShimejiImportWizard } from "../wizard/ShimejiImportWizard";
import { TomojiImportScreen } from "../import/TomojiImportScreen";
import { AddTomojiModal } from "./AddTomojiModal";
import { CharacterFrameEditor } from "./CharacterFrameEditor";
import { CharacterSettingsEditor } from "./CharacterSettingsEditor";
import { TomojiGrid } from "./TomojiGrid";
import { TomojiPageHeader } from "./TomojiPageHeader";
import { TomojiPageLayout } from "./TomojiPageLayout";

type TomojiFlow =
  | "list"
  | "archive"
  | "add"
  | "importTomoji"
  | "importShimeji"
  | "edit"
  | "editFrames";

function companionCountLabel(count: number): string {
  return `${count} companion${count === 1 ? "" : "s"}`;
}

export function TomojisView() {
  const {
    instances,
    activeInstances,
    archivedInstances,
    addCompanion,
    removeCompanion,
    toggleCompanion,
    updateCompanion,
    archiveCompanion,
    unarchiveCompanion,
    reorderCompanions,
    refreshFromDisk,
  } = useCompanionInstances();
  const [flow, setFlow] = useState<TomojiFlow>("list");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingInstance = instances.find((instance) => instance.id === editingId);

  const handleImported = async (characterId: string) => {
    await addCompanion(characterId);
    setFlow("list");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromDisk();
    } finally {
      setIsRefreshing(false);
    }
  };

  const folderActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void handleRefresh()}
        disabled={isRefreshing}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white disabled:cursor-wait disabled:opacity-50"
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </button>
      <button
        type="button"
        onClick={() => void openCharactersFolder()}
        className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
      >
        Open Tomojis folder
      </button>
    </div>
  );

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

  if (flow === "archive") {
    return (
      <TomojiPageLayout
        header={
          <TomojiPageHeader
            title="Archived Tomojis"
            subtitle={companionCountLabel(archivedInstances.length)}
            onBack={() => setFlow("list")}
            trailing={folderActions}
          />
        }
      >
        {archivedInstances.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No archived tomojis. Archive companions from their card menu to hide
            them here without deleting.
          </p>
        ) : (
          <TomojiGrid
            instances={archivedInstances}
            onDelete={removeCompanion}
            onToggle={toggleCompanion}
            onEdit={(id) => {
              setEditingId(id);
              setFlow("edit");
            }}
            onRestore={(id) => void unarchiveCompanion(id)}
          />
        )}
      </TomojiPageLayout>
    );
  }

  return (
    <TomojiPageLayout
      header={
        <TomojiPageHeader
          title="Your Tomojis"
          subtitle={companionCountLabel(activeInstances.length)}
          trailing={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFlow("archive")}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-white hover:text-white"
              >
                Archive
                {archivedInstances.length > 0
                  ? ` (${archivedInstances.length})`
                  : ""}
              </button>
              {folderActions}
            </div>
          }
        />
      }
    >
      <p className="mb-8 max-w-xl text-sm text-neutral-400">
        Toggle companions on or off, edit behavior, or import new characters.
        Drag cards to rearrange.
      </p>

      <TomojiGrid
        instances={activeInstances}
        reorderable
        onReorder={(orderedIds) => void reorderCompanions(orderedIds)}
        onDelete={removeCompanion}
        onToggle={toggleCompanion}
        onEdit={(id) => {
          setEditingId(id);
          setFlow("edit");
        }}
        onArchive={(id) => void archiveCompanion(id)}
        onAdd={() => setFlow("add")}
      />

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
