import { useMemo } from "react";
import { ANIMATION_CATEGORY_META } from "../../constants/animationCategories";
import type { ShimejiDraftController } from "../../hooks/useShimejiDraft";
import { isRequiredAnimationCategory } from "../../types/character";
import type { AnimationCategory } from "../../types/character";
import { AnimationPreviewPlayer } from "../preview/AnimationPreviewPlayer";
import { FrameOrderList } from "./FrameOrderList";
import { RequiredAnimationBadge } from "./AnimationCategoryBadge";

interface AnimationAssignmentPanelProps {
  controller: ShimejiDraftController;
  category: AnimationCategory;
}

const PREVIEW_SIZE = 112;

function countFrameUsage(frames: string[], path: string): number {
  return frames.filter((frame) => frame === path).length;
}

export function AnimationAssignmentPanel({
  controller,
  category,
}: AnimationAssignmentPanelProps) {
  const {
    draft,
    urlFor,
    framesUrls,
    addFrame,
    removeFrame,
    removeLastFrameByPath,
    moveFrame,
    setFps,
  } = controller;
  const assignment = draft.assignments[category];
  const previewFrames = framesUrls(category);
  const meta = ANIMATION_CATEGORY_META[category];
  const required = isRequiredAnimationCategory(category);
  const missingRequired = required && assignment.frames.length === 0;
  const canAdjustSpeed = assignment.frames.length > 1;

  const nameByPath = useMemo(() => {
    const map = new Map<string, string>();
    for (const source of draft.sources) {
      map.set(source.path, source.name);
    }
    return map;
  }, [draft.sources]);

  const nameFor = (path: string) => nameByPath.get(path) ?? path;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border px-4 py-3 ${
          missingRequired
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-neutral-800 bg-neutral-900/40"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-white">{meta.label}</p>
          <RequiredAnimationBadge category={category} />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-neutral-400">
          {meta.description}
        </p>
        {missingRequired ? (
          <p className="mt-2 text-xs font-medium text-amber-300">
            Add at least one frame — this slot is required.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-4">
        <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/80 p-3">
          <AnimationPreviewPlayer
            frames={previewFrames}
            fps={assignment.fps}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
          />
        </div>

        {canAdjustSpeed ? (
          <label className="min-w-[12rem] flex-1 text-xs text-neutral-300">
            Speed: {assignment.fps} fps
            <input
              type="range"
              min={1}
              max={24}
              value={assignment.fps}
              onChange={(event) => setFps(category, Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        ) : null}
      </div>

      <div>
        <div className="mb-3 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Source frames
          </p>
          <p className="text-xs text-neutral-500">
            Left-click to add · right-click to remove last copy · duplicates
            allowed
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 rounded-xl border border-neutral-800 p-3">
          {draft.sources.map((source) => {
            const usageCount = countFrameUsage(assignment.frames, source.path);

            return (
              <button
                key={source.path}
                type="button"
                onClick={() => addFrame(category, source.path)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  removeLastFrameByPath(category, source.path);
                }}
                title={
                  usageCount > 0
                    ? `${source.name} — left-click add, right-click remove last copy (${usageCount} assigned)`
                    : `${source.name} — left-click to add`
                }
                className="relative flex aspect-square items-center justify-center rounded-md border border-neutral-800 p-1 transition hover:border-neutral-500 hover:bg-neutral-900"
              >
                <img
                  src={source.url}
                  alt={source.name}
                  draggable={false}
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
                {usageCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                    {usageCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-400">
          Playback order ({assignment.frames.length})
        </p>
        <FrameOrderList
          frames={assignment.frames}
          urlFor={urlFor}
          nameFor={nameFor}
          onMove={(index, direction) => moveFrame(category, index, direction)}
          onRemove={(index) => removeFrame(category, index)}
        />
      </div>
    </div>
  );
}
