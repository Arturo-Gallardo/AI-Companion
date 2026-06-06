import type {
  AnimationCategory,
  AnimationDefinition,
  CharacterManifest,
} from "../types/character";
import type { ShimejiDraft, ShimejiSourceFrame } from "../types/shimejiDraft";
import { addCharacter } from "./characterLibrary";
import { characterDirPath, characterManifestPath } from "./fs/appPaths";
import {
  copyFile,
  ensureDir,
  joinPath,
  listDirectory,
  pickDirectory,
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

// converts the wizard draft into the Tomoji folder structure: copies the
// chosen pngs into characters/<id>/sprites/<category>/<n>.png and writes a
// valid manifest.json. only the user's own files are written - no bundling.
export async function convertShimejiDraft(
  draft: ShimejiDraft,
): Promise<string> {
  const id = crypto.randomUUID();
  const destDir = await characterDirPath(id);
  await ensureDir(destDir);

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
