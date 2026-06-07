import { invoke } from "@tauri-apps/api/core";
import { ensureBuiltinCharacterStored } from "./builtinCharacter";

// opens <appData>/characters in the system file manager
export async function openCharactersFolder(): Promise<void> {
  await ensureBuiltinCharacterStored();
  await invoke("open_characters_folder");
}
