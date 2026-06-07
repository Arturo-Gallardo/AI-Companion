import { BUILTIN_CHARACTER_ID } from "./builtinCharacter";
import { charactersDirPath } from "./fs/appPaths";
import { joinPath, listDirectory, pathExists } from "./fs/fileSystemAdapter";

// cheap snapshot of what's on disk — used to detect drops into characters/
export async function getCharactersFolderFingerprint(): Promise<string> {
  const root = await charactersDirPath();
  if (!(await pathExists(root))) {
    return "";
  }

  const entries = await listDirectory(root);
  const parts: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory || entry.name === BUILTIN_CHARACTER_ID) {
      continue;
    }

    const manifestPath = await joinPath(entry.path, "manifest.json");
    const hasManifest = await pathExists(manifestPath);
    parts.push(`${entry.name}:${hasManifest ? "1" : "0"}`);
  }

  return parts.sort().join("\0");
}
