import type { AnimationCategory } from "../types/character";

// default shimeji filename → category mapping (Beyond Birthday / standard EE)
const SHIMEJI_PRESET_ORDER: Partial<
  Record<AnimationCategory, readonly string[]>
> = {
  idle: ["shime1.png"],
  walk: ["shime1.png", "shime2.png", "shime1.png", "shime3.png"],
  sit: ["shime15.png"],
  sitOnBar: ["shime31.png"],
  dangleOnBar: ["shime31.png", "shime32.png", "shime31.png", "shime33.png"],
  fall: ["shime4.png"],
  bounce: ["shime18.png", "shime19.png"],
  dragNeutral: ["shime1.png"],
  dragMildLeft: ["shime7.png"],
  dragStrongLeft: ["shime9.png"],
  dragMildRight: ["shime8.png"],
  dragStrongRight: ["shime10.png"],
  dragResist: ["shime5.png", "shime6.png"],
  grabWall: ["shime13.png"],
  climbWallUp: ["shime14.png", "shime12.png", "shime13.png", "shime13.png"],
  grabCeiling: ["shime23.png"],
  climbCeiling: [
    "shime25.png",
    "shime25.png",
    "shime23.png",
    "shime24.png",
    "shime24.png",
    "shime24.png",
    "shime23.png",
    "shime25.png",
  ],
};

const DEFAULT_PRESET_FPS: Partial<Record<AnimationCategory, number>> = {
  walk: 8,
  sit: 4,
  dangleOnBar: 10,
  bounce: 10,
  dragResist: 10,
  climbWallUp: 10,
  climbCeiling: 10,
};

export function buildShimejiPresetAssignments(
  sources: { name: string; path: string }[],
): Partial<
  Record<AnimationCategory, { frames: string[]; fps: number }>
> {
  const pathByName = new Map(
    sources.map((source) => [source.name.toLowerCase(), source.path]),
  );
  const result: Partial<
    Record<AnimationCategory, { frames: string[]; fps: number }>
  > = {};

  for (const [category, filenames] of Object.entries(SHIMEJI_PRESET_ORDER) as [
    AnimationCategory,
    readonly string[],
  ][]) {
    const frames: string[] = [];
    for (const filename of filenames) {
      const path = pathByName.get(filename.toLowerCase());
      if (path) {
        frames.push(path);
      }
    }
    if (frames.length > 0) {
      result[category] = {
        frames,
        fps: DEFAULT_PRESET_FPS[category] ?? 8,
      };
    }
  }

  return result;
}
