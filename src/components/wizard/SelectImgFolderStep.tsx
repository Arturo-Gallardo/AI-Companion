import type { ShimejiDraftController } from "../../hooks/useShimejiDraft";

interface SelectImgFolderStepProps {
  controller: ShimejiDraftController;
}

export function SelectImgFolderStep({ controller }: SelectImgFolderStepProps) {
  const { draft, isLoadingFolder, loadImgFolder } = controller;

  return (
    <div className="space-y-5">
      <p className="max-w-xl text-sm text-neutral-400">
        Shimeji characters ship as a folder of PNG frames (usually called
        <code className="mx-1 rounded bg-neutral-800 px-1">img</code>). Pick that
        folder and we'll convert the frames you choose into a Tomoji. Your files
        stay on your machine - nothing is uploaded or redistributed.
      </p>

      <button
        type="button"
        disabled={isLoadingFolder}
        onClick={() => void loadImgFolder()}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {isLoadingFolder ? "Loading..." : "Choose img folder"}
      </button>

      {draft.imgDir ? (
        <div>
          <p className="mb-2 text-xs text-neutral-400">
            {draft.sources.length} frames found ({draft.frameWidth}x
            {draft.frameHeight})
          </p>
          <div className="grid max-h-[280px] grid-cols-8 gap-2 overflow-y-auto rounded-lg border border-neutral-800 p-2">
            {draft.sources.map((source) => (
              <div
                key={source.path}
                className="flex aspect-square items-center justify-center rounded border border-neutral-800 p-1"
                title={source.name}
              >
                <img
                  src={source.url}
                  alt={source.name}
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
