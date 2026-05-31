const MIN_DIALOGUE_MS = 2500;
const MAX_DIALOGUE_MS = 12000;
const MS_PER_CHARACTER = 45;

// longer quotes stay up a bit longer so they can be read
export function getDialogueDisplayMs(text: string): number {
  const estimated = MIN_DIALOGUE_MS + text.length * MS_PER_CHARACTER;
  return Math.min(MAX_DIALOGUE_MS, Math.max(MIN_DIALOGUE_MS, estimated));
}
