import type { Velocity } from "../animations/types";

// a single frame of an animation. src is relative to the character folder root
// for imported characters (e.g. "sprites/walk/0.png") or a resolvable url.
export interface AnimationFrame {
  src: string;
  // optional per-frame hold in engine ticks (25ms each); overrides fps when set
  durationTicks?: number;
}

// serializable animation as stored inside a character manifest. the
// AnimationRegistry converts this into the runtime form the engine consumes.
export interface AnimationDefinition {
  frames: AnimationFrame[];
  // playback rate of the loop; converted to engine ticks by the registry
  fps: number;
  // per-tick movement applied while this animation plays (screen px per tick)
  velocity?: Velocity;
}

// fine-grained buckets aligned with the engine's CompanionAction set.
// the registry maps each runtime action onto one of these slots.
export type AnimationCategory =
  | "idle"
  | "walk"
  | "sit"
  | "sitAlt"
  | "sitAlt2"
  | "sitOnBar"
  | "dangleOnBar"
  | "fall"
  | "bounce"
  | "dragNeutral"
  | "dragMildLeft"
  | "dragStrongLeft"
  | "dragMildRight"
  | "dragStrongRight"
  | "dragResist"
  | "grabWall"
  | "climbWallUp"
  | "climbWallDown"
  | "grabCeiling"
  | "climbCeiling";

export const ANIMATION_CATEGORIES: readonly AnimationCategory[] = [
  "idle",
  "walk",
  "sit",
  "sitAlt",
  "sitAlt2",
  "sitOnBar",
  "dangleOnBar",
  "fall",
  "bounce",
  "dragNeutral",
  "dragMildLeft",
  "dragStrongLeft",
  "dragMildRight",
  "dragStrongRight",
  "dragResist",
  "grabWall",
  "climbWallUp",
  "climbWallDown",
  "grabCeiling",
  "climbCeiling",
] as const;

// only idle is strictly required; everything else falls back so a partial
// character never crashes the engine.
export const REQUIRED_ANIMATION_CATEGORIES: readonly AnimationCategory[] = [
  "idle",
] as const;

export interface BehaviorSettings {
  // multiplier applied to the character base walk velocity
  movementSpeed: number;
  // 0..1 likelihood the companion starts an autonomous action when idle
  actionFrequency: number;
  // 0..1 likelihood the companion speaks on its own
  dialogueFrequency: number;
}

export interface DialogueSettings {
  lines: string[];
  // 0..1 likelihood a line is shown when a dialogue tick fires
  frequency: number;
}

export interface CharacterManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  defaultScale: number;
  // base walk speed in screen px per tick (25ms cadence)
  defaultSpeed: number;
  frameWidth: number;
  frameHeight: number;
  animations: Partial<Record<AnimationCategory, AnimationDefinition>>;
  behaviorSettings: BehaviorSettings;
  dialogueSettings: DialogueSettings;
}

export type CharacterSource = "builtin" | "tomoji" | "shimeji";

// a registered character in the local library. folderPath is the appData
// directory holding the manifest + sprites for imported characters.
export interface CharacterLibraryEntry {
  manifest: CharacterManifest;
  source: CharacterSource;
  folderPath?: string;
}
