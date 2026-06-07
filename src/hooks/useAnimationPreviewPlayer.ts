import { useEffect, useMemo, useRef, useState } from "react";

// reusable looping animation player. drives an index over the given frames at
// the given fps and instantly reflects frame/fps changes (used by the import
// wizard previews and the final preview screen).
export function useAnimationPreviewPlayer(
  frames: string[],
  fps: number,
  isPlaying = true,
): string | null {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const framesKey = useMemo(() => frames.join("|"), [frames]);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
  }, [framesKey, frames.length]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1 || fps <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextIndex = (indexRef.current + 1) % frames.length;
      indexRef.current = nextIndex;
      setIndex(nextIndex);
    }, 1000 / fps);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [framesKey, fps, isPlaying, frames.length]);

  if (frames.length === 0) {
    return null;
  }

  return frames[Math.min(index, frames.length - 1)];
}
