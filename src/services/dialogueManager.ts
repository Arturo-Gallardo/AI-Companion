import type { DialogueSettings } from "../types/character";
import { pickRandomMotivationalQuote } from "../utils/pickRandomQuote";

// picks a line for a companion: its own lines when configured, otherwise the
// built-in motivational quotes so a character without lines still talks.
export function pickDialogueLine(settings: DialogueSettings): string {
  if (settings.lines.length > 0) {
    const index = Math.floor(Math.random() * settings.lines.length);
    return settings.lines[index];
  }

  return pickRandomMotivationalQuote();
}
