import { invoke } from "@tauri-apps/api/core";

// native recursive metadata snapshot avoids hundreds of filesystem IPC calls.
export async function getCharactersFolderFingerprint(): Promise<string> {
  return invoke<string>("get_characters_folder_fingerprint");
}
