import { ANIMATION_CATEGORY_META } from "../../constants/animationCategories";
import type { ShimejiDraftController } from "../../hooks/useShimejiDraft";
import type { AnimationCategory } from "../../types/character";
import { AnimationPreviewPlayer } from "../preview/AnimationPreviewPlayer";

interface AnimationAssignmentPanelProps {
  controller: ShimejiDraftController;
  category: AnimationCategory;
}

const PREVIEW_SIZE = 96;

// assign / reorder / remove frames for a single animation category, with a
// live looping preview that updates instantly.
export function AnimationAssignmentPanel({
  controller,
  category,
}: AnimationAssignmentPanelProps) {
  const { draft, urlFor, framesUrls, toggleFrame, removeFrame, moveFrame, setFps } =
    controller;
  const assignment = draft.assignments[category];
  const previewFrames = framesUrls(category);
  const meta = ANIMATION_CATEGORY_META[category];

  return (
    <div className="grid grid-cols-[1fr_260px] gap-6">
      <div>
        <div className="mb-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
          <p className="text-sm font-bold text-white">{meta.label}</p>
          <p className="mt-1 text-xs text-neutral-400">{meta.description}</p>
          {meta.shimejiHint ? (
            <p className="mt-1 text-[11px] text-neutral-500">
              Shimeji hint: {meta.shimejiHint}
            </p>
          ) : null}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">
          Source frames (click to add/remove)
        </p>
        <div className="grid max-h-[320px] grid-cols-5 gap-2 overflow-y-auto rounded-lg border border-neutral-800 p-2">
          {draft.sources.map((source) => {
            const isAssigned = assignment.frames.includes(source.path);
            return (
              <button
                key={source.path}
                type="button"
                onClick={() => toggleFrame(category, source.path)}
                title={source.name}
                className={`flex aspect-square items-center justify-center rounded border p-1 ${
                  isAssigned
                    ? "border-white bg-white/10"
                    : "border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <img
                  src={source.url}
                  alt={source.name}
                  draggable={false}
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 py-2">
          <AnimationPreviewPlayer
            frames={previewFrames}
            fps={assignment.fps}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
          />
        </div>

        <label className="text-xs text-neutral-300">
          Speed: {assignment.fps} fps
          <input
            type="range"
            min={1}
            max={24}
            value={assignment.fps}
            onChange={(event) => setFps(category, Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">
            Order ({assignment.frames.length})
          </p>
          <ol className="flex max-h-[180px] flex-col gap-1 overflow-y-auto">
            {assignment.frames.map((path, index) => (
              <li
                key={`${path}-${index}`}
                className="flex items-center gap-2 rounded border border-neutral-800 px-2 py-1"
              >
                <img
                  src={urlFor(path)}
                  alt=""
                  className="h-7 w-7 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="flex-1 text-[11px] text-neutral-400">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => moveFrame(category, index, -1)}
                  className="px-1 text-neutral-400 hover:text-white"
                  aria-label="Move up"
                >
                  ^
                </button>
                <button
                  type="button"
                  onClick={() => moveFrame(category, index, 1)}
                  className="px-1 text-neutral-400 hover:text-white"
                  aria-label="Move down"
                >
                  v
                </button>
                <button
                  type="button"
                  onClick={() => removeFrame(category, index)}
                  className="px-1 text-red-300 hover:text-red-200"
                  aria-label="Remove"
                >
                  x
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
