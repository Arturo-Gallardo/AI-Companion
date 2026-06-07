import type { DialogueSettings } from "../types/character";
import { pickRandomMotivationalQuote } from "../utils/pickRandomQuote";
import { BUILTIN_CHARACTER_ID } from "./characterLibrary";

// picks a line for this companion. custom characters only speak their own
// lines; the built-in pet falls back to the global motivational quotes.
export function pickDialogueLine(
  settings: DialogueSettings,
  characterId: string,
): string | null {
  if (settings.lines.length > 0) {
    const index = Math.floor(Math.random() * settings.lines.length);
    return settings.lines[index];
  }

  if (characterId === BUILTIN_CHARACTER_ID) {
    return pickRandomMotivationalQuote();
  }

  return null;
}

export function hasDialogueLines(
  settings: DialogueSettings,
  characterId: string,
): boolean {
  return settings.lines.length > 0 || characterId === BUILTIN_CHARACTER_ID;
}
