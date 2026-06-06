import { useEffect, useMemo, useState } from "react";

// reusable looping animation player. drives an index over the given frames at
// the given fps and instantly reflects frame/fps changes (used by the import
// wizard previews and the final preview screen).
export function useAnimationPreviewPlayer(
  frames: string[],
  fps: number,
  isPlaying = true,
): string | null {
  const [index, setIndex] = useState(0);
  // a stable key so effects only restart when the actual frames change
  const framesKey = useMemo(() => frames.join("|"), [frames]);

  useEffect(() => {
    setIndex(0);
  }, [framesKey]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1 || fps <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, 1000 / fps);

    return () => {
      window.clearInterval(intervalId);
    };
    // framesKey captures frame identity; length/fps drive the cadence
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framesKey, fps, isPlaying, frames.length]);

  if (frames.length === 0) {
    return null;
  }

  return frames[Math.min(index, frames.length - 1)];
}
