import { emit } from "@tauri-apps/api/event";
import { COMPANION_ASSET_BASE } from "../animations/beyondBirthday";
import { BUILTIN_DEFAULT_DIALOGUE_LINES } from "../content/motivationalQuotes";
import type { CharacterLibraryEntry, CharacterManifest } from "../types/character";
import {
  characterDirPath,
  characterManifestPath,
  libraryFilePath,
} from "./fs/appPaths";
import {
  ensureDir,
  joinPath,
  pathExists,
  readJson,
  writeBinary,
  writeJson,
} from "./fs/fileSystemAdapter";

export const BUILTIN_CHARACTER_ID = "beyond-birthday";

// every frame the bundled pet references — copy what exists in the app bundle
const BUNDLED_SPRITE_FILES = [
  "shime1.png",
  "shime2.png",
  "shime3.png",
  "shime4.png",
  "shime5.png",
  "shime6.png",
  "shime7.png",
  "shime8.png",
  "shime9.png",
  "shime10.png",
  "shime11.png",
  "shime12.png",
  "shime13.png",
  "shime14.png",
  "shime15.png",
  "shime18.png",
  "shime19.png",
  "shime23.png",
  "shime24.png",
  "shime25.png",
  "shime31.png",
  "shime32.png",
  "shime33.png",
] as const;

function createDefaultManifest(): CharacterManifest {
  return {
    id: BUILTIN_CHARACTER_ID,
    name: "Beyond Birthday",
    version: "1.0.0",
    author: "Tomoji",
    defaultScale: 1,
    defaultSpeed: 2,
    frameWidth: 128,
    frameHeight: 128,
    animations: {},
    behaviorSettings: {
      movementSpeed: 1,
      actionFrequency: 0.5,
      dialogueFrequency: 0.2,
    },
    dialogueSettings: {
      lines: [...BUILTIN_DEFAULT_DIALOGUE_LINES],
      frequency: 0.2,
    },
  };
}

async function copyBundledSprites(characterDir: string): Promise<void> {
  const spritesDir = await joinPath(characterDir, "sprites", "bundled");
  await ensureDir(spritesDir);

  for (const fileName of BUNDLED_SPRITE_FILES) {
    const destPath = await joinPath(spritesDir, fileName);
    if (await pathExists(destPath)) {
      continue;
    }

    const response = await fetch(`${COMPANION_ASSET_BASE}/${fileName}`);
    if (!response.ok) {
      continue;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    await writeBinary(destPath, bytes);
  }
}

async function readLibraryFile(): Promise<CharacterLibraryEntry[]> {
  const path = await libraryFilePath();
  if (!(await pathExists(path))) {
    return [];
  }

  try {
    const file = await readJson<{ characters?: CharacterLibraryEntry[] }>(path);
    return file.characters ?? [];
  } catch (error) {
    console.error("failed to read character library", error);
    return [];
  }
}

async function writeLibraryEntry(entry: CharacterLibraryEntry): Promise<void> {
  const stored = await readLibraryFile();
  const next = [
    entry,
    ...stored.filter(
      (existing) => existing.manifest.id !== BUILTIN_CHARACTER_ID,
    ),
  ];
  await writeJson(await libraryFilePath(), {
    version: 1,
    characters: next,
  });
  await emit("character-library-changed");
}

function toLibraryEntry(
  manifest: CharacterManifest,
  folderPath: string,
): CharacterLibraryEntry {
  return {
    manifest,
    source: "builtin",
    folderPath,
  };
}

// writes beyond-birthday under <appData>/characters on first run and keeps the
// library entry in sync. sprites are copied from the app bundle when available.
export async function ensureBuiltinCharacterStored(): Promise<CharacterLibraryEntry> {
  const folderPath = await characterDirPath(BUILTIN_CHARACTER_ID);
  const manifestPath = await characterManifestPath(BUILTIN_CHARACTER_ID);

  if (!(await pathExists(manifestPath))) {
    await ensureDir(folderPath);
    const manifest = createDefaultManifest();
    await writeJson(manifestPath, manifest);
    await copyBundledSprites(folderPath);
    const entry = toLibraryEntry(manifest, folderPath);
    await writeLibraryEntry(entry);
    return entry;
  }

  const manifest = await readJson<CharacterManifest>(manifestPath);
  await copyBundledSprites(folderPath);
  const entry = toLibraryEntry(manifest, folderPath);

  const stored = await readLibraryFile();
  const existing = stored.find(
    (character) => character.manifest.id === BUILTIN_CHARACTER_ID,
  );
  if (!existing) {
    await writeLibraryEntry(entry);
  }

  return entry;
}
