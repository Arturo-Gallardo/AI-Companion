import type { AnimationCategory } from "../types/character";

export type AnimationCategoryGroupId =
  | "ground"
  | "sit"
  | "air"
  | "drag"
  | "wall"
  | "ceiling";

export interface AnimationCategoryMeta {
  id: AnimationCategory;
  label: string;
  description: string;
  group: AnimationCategoryGroupId;
  // shimeji frame hints for importers (e.g. "shime4.png")
  shimejiHint?: string;
}

export interface AnimationCategoryGroup {
  id: AnimationCategoryGroupId;
  label: string;
  categories: AnimationCategory[];
}

export const ANIMATION_CATEGORY_META: Record<
  AnimationCategory,
  AnimationCategoryMeta
> = {
  idle: {
    id: "idle",
    label: "Idle",
    description: "Standing still on the floor.",
    group: "ground",
    shimejiHint: "shime1.png",
  },
  walk: {
    id: "walk",
    label: "Walk",
    description: "Walking loop while moving horizontally.",
    group: "ground",
    shimejiHint: "shime1–3.png",
  },
  sit: {
    id: "sit",
    label: "Sit — floor (primary)",
    description:
      "Main sitting pose on the floor/taskbar. The engine picks randomly among all assigned floor sit slots.",
    group: "sit",
    shimejiHint: "shime15.png",
  },
  sitAlt: {
    id: "sitAlt",
    label: "Sit — floor (alt 1)",
    description: "Optional second floor sit pose — mixed in randomly with other floor sits.",
    group: "sit",
  },
  sitAlt2: {
    id: "sitAlt2",
    label: "Sit — floor (alt 2)",
    description: "Optional third floor sit pose — mixed in randomly with other floor sits.",
    group: "sit",
  },
  sitOnBar: {
    id: "sitOnBar",
    label: "Sit — window top (still)",
    description:
      "Static pose while perched on a window title bar. Used when no dangle loop is assigned.",
    group: "sit",
    shimejiHint: "shime31.png",
  },
  dangleOnBar: {
    id: "dangleOnBar",
    label: "Sit — window top (dangle)",
    description:
      "Animated leg-dangle loop on a window title bar. Preferred over the still bar sit when assigned.",
    group: "sit",
    shimejiHint: "shime31–33.png",
  },
  fall: {
    id: "fall",
    label: "Fall",
    description: "Single still pose while dropping through the air.",
    group: "air",
    shimejiHint: "shime4.png",
  },
  bounce: {
    id: "bounce",
    label: "Land / get up",
    description:
      "Recovery frames after hitting the floor or being thrown — the squish and stand-up.",
    group: "air",
    shimejiHint: "shime18–19.png",
  },
  dragNeutral: {
    id: "dragNeutral",
    label: "Drag — neutral",
    description: "Default pose while being held with little or no sideways movement.",
    group: "drag",
    shimejiHint: "shime1.png",
  },
  dragMildLeft: {
    id: "dragMildLeft",
    label: "Drag — mild left",
    description: "Light lean when dragged to the left (velocity-based).",
    group: "drag",
    shimejiHint: "shime7.png",
  },
  dragStrongLeft: {
    id: "dragStrongLeft",
    label: "Drag — strong left",
    description: "Strong lean when flung quickly to the left.",
    group: "drag",
    shimejiHint: "shime9.png",
  },
  dragMildRight: {
    id: "dragMildRight",
    label: "Drag — mild right",
    description: "Light lean when dragged to the right.",
    group: "drag",
    shimejiHint: "shime8.png",
  },
  dragStrongRight: {
    id: "dragStrongRight",
    label: "Drag — strong right",
    description: "Strong lean when flung quickly to the right.",
    group: "drag",
    shimejiHint: "shime10.png",
  },
  dragResist: {
    id: "dragResist",
    label: "Drag — resist",
    description: "Brief struggle loop right after the pet is picked up.",
    group: "drag",
    shimejiHint: "shime5–6.png",
  },
  grabWall: {
    id: "grabWall",
    label: "Wall cling",
    description: "Idle pose while stuck to a vertical window edge.",
    group: "wall",
    shimejiHint: "shime13.png",
  },
  climbWallUp: {
    id: "climbWallUp",
    label: "Climb up",
    description: "Frame loop for climbing up a wall.",
    group: "wall",
    shimejiHint: "shime14, shime12, shime13",
  },
  climbWallDown: {
    id: "climbWallDown",
    label: "Climb down",
    description:
      "Climbing down a wall. If empty, the engine reverses your climb-up frames.",
    group: "wall",
    shimejiHint: "same as climb up, played in reverse",
  },
  grabCeiling: {
    id: "grabCeiling",
    label: "Ceiling cling",
    description: "Idle pose under a window (underside crawl surface).",
    group: "ceiling",
    shimejiHint: "shime23.png",
  },
  climbCeiling: {
    id: "climbCeiling",
    label: "Ceiling crawl",
    description: "Loop for crawling along a window underside.",
    group: "ceiling",
    shimejiHint: "shime23–25.png",
  },
};

export const ANIMATION_CATEGORY_GROUPS: AnimationCategoryGroup[] = [
  {
    id: "ground",
    label: "Ground",
    categories: ["idle", "walk"],
  },
  {
    id: "sit",
    label: "Sitting",
    categories: ["sit", "sitAlt", "sitAlt2", "sitOnBar", "dangleOnBar"],
  },
  {
    id: "air",
    label: "Air & landing",
    categories: ["fall", "bounce"],
  },
  {
    id: "drag",
    label: "Drag & throw",
    categories: [
      "dragNeutral",
      "dragMildLeft",
      "dragStrongLeft",
      "dragMildRight",
      "dragStrongRight",
      "dragResist",
    ],
  },
  {
    id: "wall",
    label: "Wall",
    categories: ["grabWall", "climbWallUp", "climbWallDown"],
  },
  {
    id: "ceiling",
    label: "Ceiling",
    categories: ["grabCeiling", "climbCeiling"],
  },
];

// old import buckets kept for reading legacy manifests
export const LEGACY_ANIMATION_CATEGORIES = ["drag", "thrown", "climb"] as const;
export type LegacyAnimationCategory =
  (typeof LEGACY_ANIMATION_CATEGORIES)[number];
