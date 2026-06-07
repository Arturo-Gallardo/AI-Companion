import { invoke } from "@tauri-apps/api/core";
import { ensureBuiltinCharacterStored } from "./builtinCharacter";
import type { CharacterSyncResult } from "./characterLibrary";
import { reconcileTomojiRegistry } from "./companionInstanceManager";

export type { CharacterSyncResult };

// opens <appData>/characters in the system file manager
export async function openCharactersFolder(): Promise<void> {
  await ensureBuiltinCharacterStored();
  await invoke("open_characters_folder");
}

// rescans character folders on disk, updates library.json, then repairs cards
export async function refreshTomojisFromDisk(): Promise<CharacterSyncResult> {
  await reconcileTomojiRegistry({ spawnNew: true });
  return { added: 0, updated: 0, skipped: 0 };
}
