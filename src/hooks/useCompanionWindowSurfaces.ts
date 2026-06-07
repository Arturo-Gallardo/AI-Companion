import { useEffect, useRef, useState, type RefObject } from "react";
import { getWindowSurfaces } from "../services/companionApi";
import type { WindowSurface } from "../types/companion";

const SURFACE_POLL_MS = 200;

function surfacesMatch(
  current: WindowSurface[],
  next: WindowSurface[],
): boolean {
  return (
    current.length === next.length &&
    current.every((surface, index) => {
      const candidate = next[index];
      return (
        candidate !== undefined &&
        surface.hwnd === candidate.hwnd &&
        surface.left === candidate.left &&
        surface.right === candidate.right &&
        surface.top === candidate.top &&
        surface.bottom === candidate.bottom &&
        surface.titleBarBottom === candidate.titleBarBottom
      );
    })
  );
}

interface UseCompanionWindowSurfacesResult {
  surfaces: WindowSurface[];
  surfacesRef: RefObject<WindowSurface[]>;
}

export function useCompanionWindowSurfaces(
  enabled: boolean,
): UseCompanionWindowSurfacesResult {
  const [surfaces, setSurfaces] = useState<WindowSurface[]>([]);
  const surfacesRef = useRef<WindowSurface[]>([]);

  useEffect(() => {
    surfacesRef.current = surfaces;
  }, [surfaces]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function pollSurfaces() {
      try {
        const nextSurfaces = await getWindowSurfaces();
        if (!cancelled) {
          surfacesRef.current = nextSurfaces;
          setSurfaces((current) =>
            surfacesMatch(current, nextSurfaces) ? current : nextSurfaces,
          );
        }
      } catch {
        // polling failed — keep last snapshot
      }
    }

    void pollSurfaces();
    const intervalId = window.setInterval(() => {
      void pollSurfaces();
    }, SURFACE_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return { surfaces, surfacesRef };
}
