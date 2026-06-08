import {
  ANIMATION_CATEGORIES,
  type AnimationCategory,
  type AnimationDefinition,
  type CharacterManifest,
} from "../types/character";
import type { ShimejiDraft, ShimejiSourceFrame } from "../types/shimejiDraft";
import { addCharacter, getCharacter, allocateNewTomojiFolderName } from "./characterLibrary";
import {
  characterDirPath,
  characterManifestPath,
  characterSourcesDirPath,
  characterSpritesDirPath,
} from "./fs/appPaths";
import {
  copyFile,
  ensureDir,
  getBasename,
  joinPath,
  listDirectory,
  pathExists,
  pickDirectory,
  removePath,
  renamePath,
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
  const sourcesDir = await characterSourcesDirPath(characterId);
  const legacySourceDir = await joinPath(spritesDir, "source");

  if (
    !(await pathExists(sourcesDir)) &&
    (await pathExists(legacySourceDir))
  ) {
    await renamePath(legacySourceDir, sourcesDir);
  }

  const searchDir = (await pathExists(sourcesDir)) ? sourcesDir : spritesDir;
  if (!(await pathExists(searchDir))) {
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

  await walk(searchDir);

  return sources.sort((a, b) =>
    a.path.localeCompare(b.path, undefined, { numeric: true }),
  );
}

function buildAnimations(
  draft: ShimejiDraft,
  sourcePathByInput: ReadonlyMap<string, string>,
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
      frames: assignment.frames.map((source, index) => ({
        src: `sprites/${category}/${index}.png`,
        source: sourcePathByInput.get(source),
      })),
    };
  }

  return animations;
}

async function writeDraftSprites(
  characterId: string,
  draft: ShimejiDraft,
): Promise<Map<string, string>> {
  const destDir = await characterDirPath(characterId);
  const spritesDir = await characterSpritesDirPath(characterId);
  const sourcesDir = await characterSourcesDirPath(characterId);
  const transactionId = crypto.randomUUID();
  const spritesStagingDir = `${spritesDir}.${transactionId}.tmp`;
  const spritesBackupDir = `${spritesDir}.${transactionId}.bak`;
  const sourcesStagingDir = `${sourcesDir}.${transactionId}.tmp`;
  const sourcesBackupDir = `${sourcesDir}.${transactionId}.bak`;
  let spritesBackupCreated = false;
  let sourcesBackupCreated = false;
  let spritesInstalled = false;
  let sourcesInstalled = false;

  await ensureDir(destDir);

  try {
    const sourcePaths = [
      ...draft.sources.map((source) => source.path),
      ...Object.values(draft.assignments).flatMap(
        (assignment) => assignment.frames,
      ),
    ].filter((path, index, paths) => paths.indexOf(path) === index);
    const sourcePathByInput = new Map<string, string>();
    const usedSourceFilenames = new Set<string>();
    await ensureDir(sourcesStagingDir);

    for (let index = 0; index < sourcePaths.length; index += 1) {
      const source = sourcePaths[index];
      const basename = await getBasename(source);
      let filename = basename;
      let suffix = index;
      while (usedSourceFilenames.has(filename)) {
        filename = `${suffix.toString().padStart(4, "0")}-${basename}`;
        suffix += 1;
      }
      usedSourceFilenames.add(filename);
      const dest = await joinPath(sourcesStagingDir, filename);
      await copyFile(source, dest);
      sourcePathByInput.set(source, filename);
    }

    for (const [category, assignment] of Object.entries(draft.assignments) as [
      AnimationCategory,
      ShimejiDraft["assignments"][AnimationCategory],
    ][]) {
      if (assignment.frames.length === 0) {
        continue;
      }

      const categoryDir = await joinPath(spritesStagingDir, category);
      await ensureDir(categoryDir);

      for (let index = 0; index < assignment.frames.length; index += 1) {
        const source = assignment.frames[index];
        const dest = await joinPath(categoryDir, `${index}.png`);
        await copyFile(source, dest);
      }
    }

    if (await pathExists(spritesDir)) {
      await renamePath(spritesDir, spritesBackupDir);
      spritesBackupCreated = true;
    }
    if (await pathExists(sourcesDir)) {
      await renamePath(sourcesDir, sourcesBackupDir);
      sourcesBackupCreated = true;
    }

    await renamePath(sourcesStagingDir, sourcesDir);
    sourcesInstalled = true;
    await renamePath(spritesStagingDir, spritesDir);
    spritesInstalled = true;
    await Promise.allSettled([
      removePath(spritesBackupDir),
      removePath(sourcesBackupDir),
    ]);
    return sourcePathByInput;
  } catch (error) {
    await removePath(spritesStagingDir);
    await removePath(sourcesStagingDir);

    if (spritesInstalled) {
      await removePath(spritesDir);
    }
    if (spritesBackupCreated && (await pathExists(spritesBackupDir))) {
      await renamePath(spritesBackupDir, spritesDir);
    }
    if (sourcesInstalled) {
      await removePath(sourcesDir);
    }
    if (sourcesBackupCreated && (await pathExists(sourcesBackupDir))) {
      await renamePath(sourcesBackupDir, sourcesDir);
    }

    throw error;
  }
}

// hydrates the frame editor from an existing imported character on disk.
export async function loadCharacterDraft(
  characterId: string,
): Promise<ShimejiDraft> {
  const entry = await getCharacter(characterId);
  if (entry === null) {
    throw new Error("character not found");
  }

  const manifest = entry.manifest;
  const characterDir = await characterDirPath(characterId);
  const sourcesDir = await characterSourcesDirPath(characterId);
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
      if (frame.source) {
        const sourceFilename = await getBasename(frame.source);
        const sourcePath = await joinPath(sourcesDir, sourceFilename);
        if (await pathExists(sourcePath)) {
          frames.push(sourcePath);
          continue;
        }
      }

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
  const entry = await getCharacter(characterId);
  if (entry === null) {
    throw new Error("character not found");
  }

  const sourcePathByInput = await writeDraftSprites(characterId, draft);

  const manifest: CharacterManifest = {
    ...entry.manifest,
    frameWidth: draft.frameWidth,
    frameHeight: draft.frameHeight,
    animations: buildAnimations(draft, sourcePathByInput),
  };

  await writeJson(await characterManifestPath(characterId), manifest);
  await addCharacter({ ...entry, manifest });
}

// converts the wizard draft into the Tomoji folder structure: copies the
// chosen pngs into characters/<id>/sprites/<category>/<n>.png, keeps editable
// originals in characters/<id>/source, and writes a valid manifest.json.
export async function convertShimejiDraft(
  draft: ShimejiDraft,
): Promise<string> {
  const name = draft.name.trim() || "Imported Shimeji";
  const id = await allocateNewTomojiFolderName(name);
  const destDir = await characterDirPath(id);
  await ensureDir(destDir);
  const sourcePathByInput = await writeDraftSprites(id, draft);

  const manifest: CharacterManifest = {
    id,
    name: id,
    version: "1.0.0",
    author: "Imported (Shimeji)",
    defaultScale: draft.scale,
    defaultSpeed: draft.speed,
    frameWidth: draft.frameWidth,
    frameHeight: draft.frameHeight,
    animations: buildAnimations(draft, sourcePathByInput),
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
