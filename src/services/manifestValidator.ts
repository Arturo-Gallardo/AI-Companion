import { LEGACY_ANIMATION_CATEGORIES } from "../constants/animationCategories";
import {
  ANIMATION_CATEGORIES,
  REQUIRED_ANIMATION_CATEGORIES,
  type AnimationCategory,
  type AnimationDefinition,
  type CharacterManifest,
} from "../types/character";
import { joinPath, pathExists } from "./fs/fileSystemAdapter";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnimationDefinition(value: unknown): value is AnimationDefinition {
  if (!isRecord(value)) {
    return false;
  }
  if (!Array.isArray(value.frames) || typeof value.frames !== "object") {
    return false;
  }
  return value.frames.every(
    (frame) => isRecord(frame) && typeof frame.src === "string",
  );
}

// structural validation of a parsed manifest.json. confirms required fields
// exist and animation arrays are well-formed; missing optional animations are
// reported as warnings so a partial character still imports.
export function validateManifestShape(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(data)) {
    return { valid: false, errors: ["manifest.json is not an object"], warnings };
  }

  const requiredStrings = ["id", "name", "version", "author"] as const;
  for (const field of requiredStrings) {
    if (typeof data[field] !== "string" || data[field] === "") {
      errors.push(`missing or invalid "${field}"`);
    }
  }

  const requiredNumbers = [
    "defaultScale",
    "defaultSpeed",
    "frameWidth",
    "frameHeight",
  ] as const;
  for (const field of requiredNumbers) {
    if (typeof data[field] !== "number" || Number.isNaN(data[field])) {
      errors.push(`missing or invalid "${field}"`);
    }
  }

  if (!isRecord(data.animations)) {
    errors.push(`missing "animations"`);
  } else {
    const animations = data.animations;
    for (const category of ANIMATION_CATEGORIES) {
      const definition = animations[category];
      if (definition === undefined) {
        if (REQUIRED_ANIMATION_CATEGORIES.includes(category)) {
          errors.push(`missing required animation "${category}"`);
        } else {
          warnings.push(`optional animation "${category}" not provided`);
        }
        continue;
      }

      if (!isAnimationDefinition(definition)) {
        errors.push(`animation "${category}" is malformed`);
        continue;
      }

      if (definition.frames.length === 0) {
        warnings.push(`animation "${category}" has no frames`);
      }
      if (typeof definition.fps !== "number" || definition.fps <= 0) {
        errors.push(`animation "${category}" has an invalid fps`);
      }
    }

    for (const legacy of LEGACY_ANIMATION_CATEGORIES) {
      const legacyDefinition = animations[legacy];
      if (legacyDefinition !== undefined) {
        warnings.push(
          `legacy animation bucket "${legacy}" found — import wizard now uses finer categories (dragLightLeft, bounce, climbWallUp, etc.)`,
        );
        if (!isAnimationDefinition(legacyDefinition)) {
          errors.push(`legacy animation "${legacy}" is malformed`);
        }
      }
    }
  }

  if (!isRecord(data.behaviorSettings)) {
    errors.push(`missing "behaviorSettings"`);
  }
  if (!isRecord(data.dialogueSettings)) {
    errors.push(`missing "dialogueSettings"`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// confirms every referenced sprite file actually exists on disk under baseDir.
export async function validateManifestAssets(
  manifest: CharacterManifest,
  baseDir: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const entries = Object.entries(manifest.animations) as [
    AnimationCategory,
    AnimationDefinition,
  ][];

  for (const [category, definition] of entries) {
    for (const frame of definition.frames) {
      const fullPath = await joinPath(baseDir, frame.src);
      if (!(await pathExists(fullPath))) {
        errors.push(`animation "${category}" references missing file ${frame.src}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
