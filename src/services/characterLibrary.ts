import type { CharacterLibraryEntry, CharacterManifest } from "../types/character";
import { libraryFilePath, characterDirPath } from "./fs/appPaths";
import { pathExists, readJson, removePath, writeJson } from "./fs/fileSystemAdapter";

// the original bundled sprite, expressed as a library entry. its animations are
// resolved straight from the engine constants (see animationRegistry), so the
// manifest only needs to advertise metadata + defaults here.
export const BUILTIN_CHARACTER_ID = "beyond-birthday";

const LIBRARY_VERSION = 1;

const BUILTIN_MANIFEST: CharacterManifest = {
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
    lines: [],
    frequency: 0.2,
  },
};

export const BUILTIN_CHARACTER_ENTRY: CharacterLibraryEntry = {
  manifest: BUILTIN_MANIFEST,
  source: "builtin",
};

interface LibraryFile {
  version: number;
  characters: CharacterLibraryEntry[];
}

async function readStoredCharacters(): Promise<CharacterLibraryEntry[]> {
  const path = await libraryFilePath();
  if (!(await pathExists(path))) {
    return [];
  }

  try {
    const file = await readJson<LibraryFile>(path);
    return file.characters ?? [];
  } catch (error) {
    console.error("failed to read character library", error);
    return [];
  }
}

async function writeStoredCharacters(
  characters: CharacterLibraryEntry[],
): Promise<void> {
  const file: LibraryFile = { version: LIBRARY_VERSION, characters };
  await writeJson(await libraryFilePath(), file);
}

// the built-in character is always present and listed first.
export async function listCharacters(): Promise<CharacterLibraryEntry[]> {
  const stored = await readStoredCharacters();
  const imported = stored.filter(
    (entry) => entry.manifest.id !== BUILTIN_CHARACTER_ID,
  );
  return [BUILTIN_CHARACTER_ENTRY, ...imported];
}

export async function getCharacter(
  id: string,
): Promise<CharacterLibraryEntry | null> {
  if (id === BUILTIN_CHARACTER_ID) {
    return BUILTIN_CHARACTER_ENTRY;
  }

  const stored = await readStoredCharacters();
  return stored.find((entry) => entry.manifest.id === id) ?? null;
}

export async function addCharacter(
  entry: CharacterLibraryEntry,
): Promise<void> {
  const stored = await readStoredCharacters();
  const next = [
    ...stored.filter((existing) => existing.manifest.id !== entry.manifest.id),
    entry,
  ];
  await writeStoredCharacters(next);
}

export async function removeCharacter(id: string): Promise<void> {
  if (id === BUILTIN_CHARACTER_ID) {
    return;
  }

  const stored = await readStoredCharacters();
  await writeStoredCharacters(
    stored.filter((entry) => entry.manifest.id !== id),
  );
  await removePath(await characterDirPath(id));
}
