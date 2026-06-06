import {
  SPRITE_HEIGHT,
  SPRITE_WIDTH,
  TICK_INTERVAL_MS,
  TITLE_BAR_SIT_ANCHOR,
  UNDERSIDE_GRAB_ANCHOR,
  getAnimationForAction,
  getFramePath,
  getGrabbedFrameFromLeanTier,
  getSpriteAnchorForAction,
  resolveDisplayAction,
} from "../animations/beyondBirthday";
import type {
  AnimationDefinition as RuntimeAnimation,
  CompanionAction,
  GrabbedLeanTier,
  SpriteAnchor,
} from "../animations/types";
import { LEGACY_ANIMATION_CATEGORIES } from "../constants/animationCategories";
import {
  ANIMATION_CATEGORIES,
  type AnimationCategory,
  type AnimationDefinition,
  type CharacterLibraryEntry,
  type CharacterManifest,
} from "../types/character";
import type { SurfaceLock } from "../types/companion";
import { BUILTIN_CHARACTER_ID } from "./characterLibrary";
import { characterDirPath } from "./fs/appPaths";
import { joinPath, toAssetUrl } from "./fs/fileSystemAdapter";

// transparent 1x1 png so a character missing an animation never renders broken
const FALLBACK_FRAME =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// resolves a runtime animation + sprite geometry for whichever character a
// companion instance uses. the built-in character is served straight from the
// engine constants so its physics/animation stay byte-for-byte identical.
export interface AnimationRegistry {
  spriteWidth: number;
  spriteHeight: number;
  getAnimation: (action: CompanionAction) => RuntimeAnimation;
  getSpriteAnchor: (action: CompanionAction) => SpriteAnchor;
  resolveDisplayAction: (
    action: CompanionAction,
    lock: SurfaceLock | null,
  ) => CompanionAction;
  getGrabbedLeanFrame: (tier: GrabbedLeanTier) => string;
  // picks a floor sit variant among assigned sit / sitAlt / sitAlt2 slots
  pickFloorSitAction: () => CompanionAction;
}

export function createBuiltinRegistry(): AnimationRegistry {
  return {
    spriteWidth: SPRITE_WIDTH,
    spriteHeight: SPRITE_HEIGHT,
    getAnimation: (action) => {
      const definition = getAnimationForAction(action);
      return {
        ...definition,
        frames: definition.frames.map(getFramePath),
      };
    },
    getSpriteAnchor: getSpriteAnchorForAction,
    resolveDisplayAction,
    getGrabbedLeanFrame: (tier) =>
      getFramePath(getGrabbedFrameFromLeanTier(tier)),
    pickFloorSitAction: () => "sit",
  };
}

const FLOOR_SIT_ACTIONS: readonly CompanionAction[] = [
  "sit",
  "sitAlt",
  "sitAlt2",
];

function isFloorSitAction(action: CompanionAction): boolean {
  return FLOOR_SIT_ACTIONS.includes(action);
}

// each engine action maps to one manifest slot.
const ACTION_TO_CATEGORY: Record<CompanionAction, AnimationCategory> = {
  idle: "idle",
  walk: "walk",
  sit: "sit",
  sitAlt: "sitAlt",
  sitAlt2: "sitAlt2",
  sitOnBar: "sitOnBar",
  dangleOnBar: "dangleOnBar",
  fall: "fall",
  bounce: "bounce",
  grabbed: "dragNeutral",
  resist: "dragResist",
  grabWall: "grabWall",
  climbWall: "climbWallUp",
  climbWallDown: "climbWallDown",
  grabCeiling: "grabCeiling",
  climbCeiling: "climbCeiling",
};

const LEAN_TIER_TO_CATEGORY: Record<GrabbedLeanTier, AnimationCategory> = {
  neutral: "dragNeutral",
  mildLeft: "dragMildLeft",
  strongLeft: "dragStrongLeft",
  mildRight: "dragMildRight",
  strongRight: "dragStrongRight",
};

// when reading older manifests that only had drag / thrown / climb buckets
const LEGACY_CATEGORY_FALLBACKS: Partial<
  Record<AnimationCategory, readonly string[]>
> = {
  dragNeutral: ["dragNeutral", "drag"],
  dragMildLeft: ["dragMildLeft", "drag"],
  dragStrongLeft: ["dragStrongLeft", "drag"],
  dragMildRight: ["dragMildRight", "drag"],
  dragStrongRight: ["dragStrongRight", "drag"],
  dragResist: ["dragResist", "drag"],
  fall: ["fall", "thrown"],
  bounce: ["bounce", "thrown"],
  grabWall: ["grabWall", "climb"],
  climbWallUp: ["climbWallUp", "climb"],
  climbWallDown: ["climbWallDown", "climb"],
  grabCeiling: ["grabCeiling", "climb"],
  climbCeiling: ["climbCeiling", "climb"],
  sitAlt: ["sitAlt", "sit"],
  sitAlt2: ["sitAlt2", "sit"],
  sitOnBar: ["sitOnBar", "sit"],
  dangleOnBar: ["dangleOnBar", "sit"],
};

type LegacyAnimationCategory = (typeof LEGACY_ANIMATION_CATEGORIES)[number];

function fpsToTickDuration(fps: number): number {
  if (fps <= 0) {
    return 6;
  }
  return Math.max(1, Math.round(1000 / fps / TICK_INTERVAL_MS));
}

function actionVelocity(
  action: CompanionAction,
  speed: number,
): { x: number; y: number } {
  switch (action) {
    case "walk":
    case "climbCeiling":
      return { x: -speed, y: 0 };
    case "climbWall":
      return { x: 0, y: -speed };
    case "climbWallDown":
      return { x: 0, y: speed };
    default:
      return { x: 0, y: 0 };
  }
}

function importedSpriteAnchor(
  action: CompanionAction,
  width: number,
  height: number,
): SpriteAnchor {
  if (action === "sitOnBar" || action === "dangleOnBar") {
    return {
      x: width / 2,
      y: height * (TITLE_BAR_SIT_ANCHOR.y / SPRITE_HEIGHT),
    };
  }
  if (action === "grabCeiling" || action === "climbCeiling") {
    return {
      x: width / 2,
      y: height * (UNDERSIDE_GRAB_ANCHOR.y / SPRITE_HEIGHT),
    };
  }
  return { x: width / 2, y: height };
}

async function resolveCategoryFrames(
  characterId: string,
  definition: AnimationDefinition | undefined,
): Promise<string[]> {
  if (!definition || definition.frames.length === 0) {
    return [];
  }

  const dir = await characterDirPath(characterId);
  const urls: string[] = [];
  for (const frame of definition.frames) {
    urls.push(toAssetUrl(await joinPath(dir, frame.src)));
  }
  return urls;
}

interface ResolvedCategoryData {
  frames: string[];
  tickDuration: number;
  frameTickDurations?: number[];
}

function readLegacyDefinition(
  manifest: CharacterManifest,
  key: LegacyAnimationCategory,
): AnimationDefinition | undefined {
  const animations = manifest.animations as Partial<
    Record<AnimationCategory | LegacyAnimationCategory, AnimationDefinition>
  >;
  return animations[key];
}

function resolveCategoryDefinition(
  manifest: CharacterManifest,
  category: AnimationCategory,
): AnimationDefinition | undefined {
  if (manifest.animations[category]) {
    return manifest.animations[category];
  }

  const fallbacks = LEGACY_CATEGORY_FALLBACKS[category] ?? [category];
  for (const key of fallbacks) {
    if (key === "drag" || key === "thrown" || key === "climb") {
      const legacy = readLegacyDefinition(manifest, key);
      if (legacy) {
        return legacy;
      }
      continue;
    }

    if (manifest.animations[key as AnimationCategory]) {
      return manifest.animations[key as AnimationCategory];
    }
  }

  return undefined;
}

function reverseFrames(frames: string[]): string[] {
  return [...frames].reverse();
}

function reverseTickDurations(
  durations: number[] | undefined,
  frameCount: number,
): number[] | undefined {
  if (!durations || durations.length !== frameCount) {
    return durations;
  }
  return [...durations].reverse();
}

async function buildImportedRegistry(
  manifest: CharacterManifest,
): Promise<AnimationRegistry> {
  const speed = manifest.defaultSpeed;
  const width = manifest.frameWidth;
  const height = manifest.frameHeight;

  const categoryData = new Map<AnimationCategory, ResolvedCategoryData>();

  for (const slot of ANIMATION_CATEGORIES) {
    const definition = resolveCategoryDefinition(manifest, slot);
    const frames = await resolveCategoryFrames(manifest.id, definition);
    const tickDuration = definition
      ? fpsToTickDuration(definition.fps)
      : 6;
    const frameTickDurations = definition?.frames.some(
      (frame) => frame.durationTicks,
    )
      ? definition.frames.map(
          (frame) => frame.durationTicks ?? tickDuration,
        )
      : undefined;

    categoryData.set(slot, { frames, tickDuration, frameTickDurations });
  }

  const idleFrames = categoryData.get("idle")?.frames ?? [];

  const firstFrame = (category: AnimationCategory): string | undefined => {
    const data = categoryData.get(category);
    return data?.frames[0];
  };

  const framesForCategory = (category: AnimationCategory): string[] => {
    const data = categoryData.get(category);
    if (data && data.frames.length > 0) {
      return data.frames;
    }
    if (idleFrames.length > 0) {
      return idleFrames;
    }
    return [FALLBACK_FRAME];
  };

  const getAnimation = (action: CompanionAction): RuntimeAnimation => {
    const category = ACTION_TO_CATEGORY[action];

    if (action === "climbWallDown") {
      const down = categoryData.get("climbWallDown");
      if (down && down.frames.length > 0) {
        return {
          frames: down.frames,
          tickDuration: down.tickDuration,
          frameTickDurations: down.frameTickDurations,
          velocity: actionVelocity(action, speed),
        };
      }

      const up = categoryData.get("climbWallUp");
      if (up && up.frames.length > 0) {
        return {
          frames: reverseFrames(up.frames),
          tickDuration: up.tickDuration,
          frameTickDurations: reverseTickDurations(
            up.frameTickDurations,
            up.frames.length,
          ),
          velocity: actionVelocity(action, speed),
        };
      }
    }

    const data = categoryData.get(category);
    const resolvedFrames = framesForCategory(category);

    return {
      frames: resolvedFrames,
      tickDuration: data?.tickDuration ?? 6,
      frameTickDurations: data?.frameTickDurations,
      velocity: actionVelocity(action, speed),
    };
  };

  const hasCategoryFrames = (category: AnimationCategory): boolean => {
    const data = categoryData.get(category);
    return (data?.frames.length ?? 0) > 0;
  };

  const pickFloorSitAction = (): CompanionAction => {
    const available = FLOOR_SIT_ACTIONS.filter((action) =>
      hasCategoryFrames(ACTION_TO_CATEGORY[action]),
    );
    if (available.length === 0) {
      return "sit";
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const resolveImportedDisplayAction = (
    action: CompanionAction,
    lock: SurfaceLock | null,
  ): CompanionAction => {
    if (lock?.kind === "titleBar" && isFloorSitAction(action)) {
      if (hasCategoryFrames("dangleOnBar")) {
        return "dangleOnBar";
      }
      if (hasCategoryFrames("sitOnBar")) {
        return "sitOnBar";
      }
      return action;
    }

    return resolveDisplayAction(action, lock);
  };

  const getGrabbedLeanFrame = (tier: GrabbedLeanTier): string => {
    const category = LEAN_TIER_TO_CATEGORY[tier];
    const direct = firstFrame(category);
    if (direct) {
      return direct;
    }

    const neutral = firstFrame("dragNeutral");
    if (neutral) {
      return neutral;
    }

    return framesForCategory("idle")[0] ?? FALLBACK_FRAME;
  };

  return {
    spriteWidth: width,
    spriteHeight: height,
    getAnimation,
    getSpriteAnchor: (action) => importedSpriteAnchor(action, width, height),
    resolveDisplayAction: resolveImportedDisplayAction,
    getGrabbedLeanFrame,
    pickFloorSitAction,
  };
}

export async function buildAnimationRegistry(
  entry: CharacterLibraryEntry,
): Promise<AnimationRegistry> {
  if (entry.source === "builtin" || entry.manifest.id === BUILTIN_CHARACTER_ID) {
    return createBuiltinRegistry();
  }

  return buildImportedRegistry(entry.manifest);
}
