import {
  ANIMATION_CATEGORIES,
  type AnimationCategory,
  type AnimationDefinition,
  type CharacterManifest,
} from "../types/character";
import type { ShimejiDraft, ShimejiSourceFrame } from "../types/shimejiDraft";
import {
  BUILTIN_CHARACTER_ID,
  addCharacter,
  getCharacter,
} from "./characterLibrary";
import {
  characterDirPath,
  characterManifestPath,
  characterSpritesDirPath,
} from "./fs/appPaths";
import {
  copyFile,
  ensureDir,
  joinPath,
  listDirectory,
  pathExists,
  pickDirectory,
  removePath,
  toAssetUrl,
  writeJson,
} from "./fs/fileSystemAdapter";

export async function pickShimejiImgFolder(): Promise<string | null> {
  return pickDirectory("Select the Shimeji img folder");
}

// lists the png frames inside a Shimeji img folder, sorted by name.
export async function listShimejiFrames(
  dir: string,
): Promise<ShimejiSourceFrame[]> {
  const entries = await listDirectory(dir);
  return entries
    .filter((entry) => entry.isFile && entry.name.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((entry) => ({
      name: entry.name,
      path: entry.path,
      url: toAssetUrl(entry.path),
    }));
}

async function listCharacterSpriteSources(
  characterId: string,
): Promise<ShimejiSourceFrame[]> {
  const spritesDir = await characterSpritesDirPath(characterId);
  if (!(await pathExists(spritesDir))) {
    return [];
  }

  const sources: ShimejiSourceFrame[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await listDirectory(dir);
    for (const entry of entries) {
      if (entry.isDirectory) {
        await walk(entry.path);
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".png")) {
        continue;
      }

      sources.push({
        name: entry.name,
        path: entry.path,
        url: toAssetUrl(entry.path),
      });
    }
  }

  await walk(spritesDir);

  return sources.sort((a, b) =>
    a.path.localeCompare(b.path, undefined, { numeric: true }),
  );
}

function buildAnimations(
  draft: ShimejiDraft,
): Partial<Record<AnimationCategory, AnimationDefinition>> {
  const animations: Partial<Record<AnimationCategory, AnimationDefinition>> = {};

  for (const [category, assignment] of Object.entries(draft.assignments) as [
    AnimationCategory,
    ShimejiDraft["assignments"][AnimationCategory],
  ][]) {
    if (assignment.frames.length === 0) {
      continue;
    }

    animations[category] = {
      fps: assignment.fps,
      frames: assignment.frames.map((_, index) => ({
        src: `sprites/${category}/${index}.png`,
      })),
    };
  }

  return animations;
}

async function writeDraftSprites(
  characterId: string,
  draft: ShimejiDraft,
): Promise<void> {
  const destDir = await characterDirPath(characterId);
  await ensureDir(destDir);
  await removePath(await characterSpritesDirPath(characterId));

  for (const [category, assignment] of Object.entries(draft.assignments) as [
    AnimationCategory,
    ShimejiDraft["assignments"][AnimationCategory],
  ][]) {
    if (assignment.frames.length === 0) {
      continue;
    }

    const categoryDir = await joinPath(destDir, "sprites", category);
    await ensureDir(categoryDir);

    for (let index = 0; index < assignment.frames.length; index += 1) {
      const source = assignment.frames[index];
      const dest = await joinPath(categoryDir, `${index}.png`);
      await copyFile(source, dest);
    }
  }
}

// hydrates the frame editor from an existing imported character on disk.
export async function loadCharacterDraft(
  characterId: string,
): Promise<ShimejiDraft> {
  if (characterId === BUILTIN_CHARACTER_ID) {
    throw new Error("built-in character frames cannot be edited");
  }

  const entry = await getCharacter(characterId);
  if (entry === null) {
    throw new Error("character not found");
  }

  const manifest = entry.manifest;
  const characterDir = await characterDirPath(characterId);
  const sources = await listCharacterSpriteSources(characterId);
  const assignments = ANIMATION_CATEGORIES.reduce(
    (accumulator, category) => {
      accumulator[category] = { frames: [], fps: 8 };
      return accumulator;
    },
    {} as ShimejiDraft["assignments"],
  );

  for (const category of ANIMATION_CATEGORIES) {
    const definition = manifest.animations[category];
    if (!definition || definition.frames.length === 0) {
      continue;
    }

    const frames: string[] = [];
    for (const frame of definition.frames) {
      frames.push(await joinPath(characterDir, frame.src));
    }

    assignments[category] = {
      frames,
      fps: definition.fps,
    };
  }

  return {
    imgDir: characterDir,
    sources,
    assignments,
    name: manifest.name,
    dialogueLines: manifest.dialogueSettings.lines,
    dialogueFrequency: manifest.dialogueSettings.frequency,
    behavior: manifest.behaviorSettings,
    scale: manifest.defaultScale,
    speed: manifest.defaultSpeed,
    frameWidth: manifest.frameWidth,
    frameHeight: manifest.frameHeight,
  };
}

// rewrites sprite files + manifest animations for an existing character.
export async function saveCharacterDraft(
  characterId: string,
  draft: ShimejiDraft,
): Promise<void> {
  if (characterId === BUILTIN_CHARACTER_ID) {
    throw new Error("built-in character frames cannot be edited");
  }

  const entry = await getCharacter(characterId);
  if (entry === null) {
    throw new Error("character not found");
  }

  await writeDraftSprites(characterId, draft);

  const manifest: CharacterManifest = {
    ...entry.manifest,
    frameWidth: draft.frameWidth,
    frameHeight: draft.frameHeight,
    animations: buildAnimations(draft),
  };

  await writeJson(await characterManifestPath(characterId), manifest);
  await addCharacter({ ...entry, manifest });
}

// converts the wizard draft into the Tomoji folder structure: copies the
// chosen pngs into characters/<id>/sprites/<category>/<n>.png and writes a
// valid manifest.json. only the user's own files are written - no bundling.
export async function convertShimejiDraft(
  draft: ShimejiDraft,
): Promise<string> {
  const id = crypto.randomUUID();
  const destDir = await characterDirPath(id);
  await ensureDir(destDir);
  await writeDraftSprites(id, draft);

  const manifest: CharacterManifest = {
    id,
    name: draft.name.trim() || "Imported Shimeji",
    version: "1.0.0",
    author: "Imported (Shimeji)",
    defaultScale: draft.scale,
    defaultSpeed: draft.speed,
    frameWidth: draft.frameWidth,
    frameHeight: draft.frameHeight,
    animations: buildAnimations(draft),
    behaviorSettings: draft.behavior,
    dialogueSettings: {
      lines: draft.dialogueLines,
      frequency: draft.dialogueFrequency,
    },
  };

  await writeJson(await characterManifestPath(id), manifest);
  await addCharacter({ manifest, source: "shimeji", folderPath: destDir });

  return id;
}
