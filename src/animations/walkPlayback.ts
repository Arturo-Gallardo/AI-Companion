// shimeji walk uses three poses with frame 1 repeated in the cycle.
// default order is 1→2→1→3; we start on frame 2 so playback is 2→1→3→1…
const WALK_INDEX_PATTERN = [1, 0, 2, 0] as const;

export function getWalkFrameIndex(step: number, frameCount: number): number {
  if (frameCount <= 1) {
    return 0;
  }

  if (frameCount === 2) {
    return [1, 0][step % 2] ?? 0;
  }

  const pattern = WALK_INDEX_PATTERN.map((index) =>
    Math.min(index, frameCount - 1),
  );

  return pattern[step % pattern.length] ?? 0;
}

export function getInitialWalkStep(): number {
  return 0;
}
