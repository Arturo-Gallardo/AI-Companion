import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDesktopBounds,
  hitTitleBarAt,
  setCompanionPosition,
} from "../services/companionApi";
import type {
  AnchorClampMode,
  DesktopBounds,
  ScreenPosition,
  WindowSurface,
} from "../types/companion";
import {
  clampToDesktopWalls,
  getDesktopHorizontalRange,
  getRightmostMonitorFloorStart,
} from "../utils/monitorBounds";
import {
  clampXToRange,
  findSurfaceByHwnd,
  getSurfaceHorizontalRange,
  hasLockedSurfaceMoved,
  resolveFloorYAt,
  toLockedSurfaceSnapshot,
  type LockedSurfaceSnapshot,
} from "../utils/windowSurfaces";
import { useCompanionWindowSurfaces } from "./useCompanionWindowSurfaces";

interface UseCompanionMovementOptions {
  onSurfaceLockLost?: () => void;
}

interface UseCompanionMovementResult {
  desktopBounds: DesktopBounds | null;
  anchorX: number;
  anchorY: number;
  isReady: boolean;
  isSurfaceLocked: boolean;
  moveBy: (deltaX: number) => boolean;
  setAnchorX: (nextX: number) => Promise<void>;
  setAnchorPosition: (
    position: ScreenPosition,
    mode?: AnchorClampMode,
  ) => Promise<void>;
  clampAnchorX: (x: number) => number;
  clampToWalls: (x: number, y: number) => ScreenPosition;
  clampAnchorPosition: (x: number, y: number) => ScreenPosition;
  getFloorYAt: (x: number, y: number) => number;
  getAnchorPosition: () => ScreenPosition;
  getHorizontalWalkRange: () => { minX: number; maxX: number } | null;
  clearSurfaceLock: () => void;
  tryLockSurfaceAt: (x: number, y: number) => Promise<WindowSurface | null>;
}

export function useCompanionMovement(
  options: UseCompanionMovementOptions = {},
): UseCompanionMovementResult {
  const { onSurfaceLockLost } = options;
  const onSurfaceLockLostRef = useRef(onSurfaceLockLost);

  useEffect(() => {
    onSurfaceLockLostRef.current = onSurfaceLockLost;
  }, [onSurfaceLockLost]);

  const [desktopBounds, setDesktopBounds] = useState<DesktopBounds | null>(
    null,
  );
  const [anchorX, setAnchorXState] = useState(0);
  const [anchorY, setAnchorYState] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [lockedHwnd, setLockedHwnd] = useState<number | null>(null);

  const anchorRef = useRef<ScreenPosition>({ x: 0, y: 0 });
  const desktopBoundsRef = useRef<DesktopBounds | null>(null);
  const lockedHwndRef = useRef<number | null>(null);
  const lockedSurfaceSnapshotRef = useRef<LockedSurfaceSnapshot | null>(null);

  const { surfaces, surfacesRef } = useCompanionWindowSurfaces(isReady);

  useEffect(() => {
    desktopBoundsRef.current = desktopBounds;
  }, [desktopBounds]);

  useEffect(() => {
    lockedHwndRef.current = lockedHwnd;
  }, [lockedHwnd]);

  const getLockedSurface = useCallback((): WindowSurface | null => {
    return findSurfaceByHwnd(surfacesRef.current, lockedHwndRef.current);
  }, [surfacesRef]);

  const getHorizontalBounds = useCallback((): {
    minX: number;
    maxX: number;
  } | null => {
    const lockedSurface = getLockedSurface();
    if (lockedSurface) {
      return getSurfaceHorizontalRange(lockedSurface);
    }

    const bounds = desktopBoundsRef.current;
    if (!bounds) {
      return null;
    }

    return getDesktopHorizontalRange(bounds);
  }, [getLockedSurface]);

  const resolveFloorYAtPosition = useCallback((x: number, y: number): number => {
    const bounds = desktopBoundsRef.current;
    if (!bounds) {
      return y;
    }

    return resolveFloorYAt(
      x,
      y,
      bounds.monitors,
      getLockedSurface(),
    );
  }, [getLockedSurface]);

  const clampHorizontalX = useCallback(
    (x: number): number => {
      const range = getHorizontalBounds();
      if (!range) {
        return x;
      }

      return clampXToRange(x, range.minX, range.maxX);
    },
    [getHorizontalBounds],
  );

  const clampToWallsPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const bounds = desktopBoundsRef.current;
      const horizontalX = clampHorizontalX(x);

      if (!bounds) {
        return { x: horizontalX, y };
      }

      const walled = clampToDesktopWalls(horizontalX, y, bounds);

      return {
        x: clampHorizontalX(walled.x),
        y: walled.y,
      };
    },
    [clampHorizontalX],
  );

  const clampGroundedPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const walled = clampToWallsPosition(x, y);

      return {
        x: walled.x,
        y: resolveFloorYAtPosition(walled.x, walled.y),
      };
    },
    [clampToWallsPosition, resolveFloorYAtPosition],
  );

  const clampAnchorX = useCallback(
    (x: number): number => {
      return clampHorizontalX(x);
    },
    [clampHorizontalX],
  );

  const applyAnchorPosition = useCallback(
    async (position: ScreenPosition, mode: AnchorClampMode = "grounded") => {
      const nextPosition =
        mode === "walls"
          ? clampToWallsPosition(position.x, position.y)
          : clampGroundedPosition(position.x, position.y);

      anchorRef.current = nextPosition;
      setAnchorXState(nextPosition.x);
      setAnchorYState(nextPosition.y);

      await setCompanionPosition(nextPosition);
    },
    [clampGroundedPosition, clampToWallsPosition],
  );

  const clearSurfaceLock = useCallback(() => {
    lockedHwndRef.current = null;
    lockedSurfaceSnapshotRef.current = null;
    setLockedHwnd(null);
  }, []);

  const tryLockSurfaceAt = useCallback(
    async (x: number, y: number): Promise<WindowSurface | null> => {
      try {
        const surface = await hitTitleBarAt(x, y);
        if (!surface) {
          return null;
        }

        lockedHwndRef.current = surface.hwnd;
        lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(surface);
        setLockedHwnd(surface.hwnd);
        return surface;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (lockedHwnd === null) {
      lockedSurfaceSnapshotRef.current = null;
      return;
    }

    const surface = findSurfaceByHwnd(surfaces, lockedHwnd);
    if (!surface) {
      clearSurfaceLock();
      onSurfaceLockLostRef.current?.();
      return;
    }

    const previousSnapshot = lockedSurfaceSnapshotRef.current;
    if (!previousSnapshot) {
      lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(surface);
      return;
    }

    if (hasLockedSurfaceMoved(previousSnapshot, surface)) {
      clearSurfaceLock();
      onSurfaceLockLostRef.current?.();
      return;
    }

    lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(surface);
  }, [clearSurfaceLock, lockedHwnd, surfaces]);

  useEffect(() => {
    let cancelled = false;

    async function initPosition() {
      const bounds = await getDesktopBounds();
      if (cancelled) {
        return;
      }

      setDesktopBounds(bounds);
      desktopBoundsRef.current = bounds;

      const startPosition = getRightmostMonitorFloorStart(bounds);

      anchorRef.current = startPosition;
      setAnchorXState(startPosition.x);
      setAnchorYState(startPosition.y);
      setIsReady(true);

      await setCompanionPosition(startPosition);
    }

    void initPosition();

    return () => {
      cancelled = true;
    };
  }, []);

  const getAnchorPosition = useCallback((): ScreenPosition => {
    return anchorRef.current;
  }, []);

  const moveBy = useCallback(
    (deltaX: number): boolean => {
      const current = anchorRef.current;
      const nextX = clampAnchorX(current.x + deltaX);

      if (nextX === current.x && Math.abs(deltaX) > 0) {
        return false;
      }

      void applyAnchorPosition(
        {
          x: nextX,
          y: current.y,
        },
        "grounded",
      );

      return true;
    },
    [applyAnchorPosition, clampAnchorX],
  );

  const setAnchorX = useCallback(
    async (nextX: number) => {
      const current = anchorRef.current;
      await applyAnchorPosition(
        { x: clampAnchorX(nextX), y: current.y },
        "grounded",
      );
    },
    [applyAnchorPosition, clampAnchorX],
  );

  const setAnchorPosition = useCallback(
    async (position: ScreenPosition, mode: AnchorClampMode = "grounded") => {
      await applyAnchorPosition(position, mode);
    },
    [applyAnchorPosition],
  );

  const getHorizontalWalkRange = useCallback((): {
    minX: number;
    maxX: number;
  } | null => {
    return getHorizontalBounds();
  }, [getHorizontalBounds]);

  return {
    desktopBounds,
    anchorX,
    anchorY,
    isReady,
    isSurfaceLocked: lockedHwnd !== null,
    moveBy,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls: clampToWallsPosition,
    clampAnchorPosition: clampGroundedPosition,
    getFloorYAt: resolveFloorYAtPosition,
    getAnchorPosition,
    getHorizontalWalkRange,
    clearSurfaceLock,
    tryLockSurfaceAt,
  };
}
