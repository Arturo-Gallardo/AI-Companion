import { emit } from "@tauri-apps/api/event";
import type { CharacterLibraryEntry } from "../types/character";
import {
  BUILTIN_CHARACTER_ID,
  ensureBuiltinCharacterStored,
} from "./builtinCharacter";
import { libraryFilePath, characterDirPath } from "./fs/appPaths";
import { pathExists, readJson, removePath, writeJson } from "./fs/fileSystemAdapter";

export { BUILTIN_CHARACTER_ID };

// broadcast when imported character manifests or sprites change on disk.
export const CHARACTER_LIBRARY_EVENT = "character-library-changed";

const LIBRARY_VERSION = 1;

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
  await emit(CHARACTER_LIBRARY_EVENT);
}

// beyond-birthday lives on disk like every other character; listed first.
export async function listCharacters(): Promise<CharacterLibraryEntry[]> {
  const builtin = await ensureBuiltinCharacterStored();
  const stored = await readStoredCharacters();
  const imported = stored.filter(
    (entry) => entry.manifest.id !== BUILTIN_CHARACTER_ID,
  );
  return [builtin, ...imported];
}

export async function getCharacter(
  id: string,
): Promise<CharacterLibraryEntry | null> {
  if (id === BUILTIN_CHARACTER_ID) {
    return ensureBuiltinCharacterStored();
  }

  const stored = await readStoredCharacters();
  return stored.find((entry) => entry.manifest.id === id) ?? null;
}

export async function addCharacter(
  entry: CharacterLibraryEntry,
): Promise<void> {
  if (entry.manifest.id === BUILTIN_CHARACTER_ID) {
    return;
  }

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
