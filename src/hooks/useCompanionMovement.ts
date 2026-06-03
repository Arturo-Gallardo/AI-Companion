import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  getDesktopBounds,
  hitTitleBarAt,
  hitWindowWallAt,
  setCompanionPosition,
} from "../services/companionApi";
import type {
  AnchorClampMode,
  DesktopBounds,
  ScreenPosition,
  SurfaceLock,
  WindowSurface,
} from "../types/companion";
import {
  clampToDesktopWalls,
  getDesktopHorizontalRange,
  getRightmostMonitorFloorStart,
} from "../utils/monitorBounds";
import {
  hitScreenEdgeWallAt,
  isScreenEdgeHwnd,
  screenEdgeSurfaceFromWallHit,
} from "../utils/screenEdgeWalls";
import {
  clampWallAnchorPosition,
  clampWallAnchorY,
  clampXToRange,
  findSurfaceByHwnd,
  getSurfaceHorizontalRange,
  getWallVerticalRange,
  hasLockedSurfaceMoved,
  isTitleBarLock,
  isWallLock,
  resolveFloorYAt,
  surfaceLockFromTitleBar,
  surfaceLockFromWall,
  toLockedSurfaceSnapshot,
  windowSurfaceFromWallHit,
  type LockedSurfaceSnapshot,
} from "../utils/windowSurfaces";
import { useCompanionWindowSurfaces } from "./useCompanionWindowSurfaces";

interface UseCompanionMovementOptions {
  onSurfaceLockLost?: () => void;
  usesTitleBarSitAnchorRef?: RefObject<boolean>;
}

interface UseCompanionMovementResult {
  desktopBounds: DesktopBounds | null;
  anchorX: number;
  anchorY: number;
  isReady: boolean;
  surfaceLock: SurfaceLock | null;
  isSurfaceLocked: boolean;
  isWallLocked: boolean;
  moveBy: (deltaX: number) => boolean;
  moveByY: (deltaY: number) => boolean;
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
  getVerticalClimbRange: () => { minY: number; maxY: number } | null;
  clearSurfaceLock: () => void;
  tryLockSurfaceAt: (x: number, y: number) => Promise<SurfaceLock | null>;
}

export function useCompanionMovement(
  options: UseCompanionMovementOptions = {},
): UseCompanionMovementResult {
  const { onSurfaceLockLost, usesTitleBarSitAnchorRef } = options;
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
  const [surfaceLock, setSurfaceLock] = useState<SurfaceLock | null>(null);

  const anchorRef = useRef<ScreenPosition>({ x: 0, y: 0 });
  const desktopBoundsRef = useRef<DesktopBounds | null>(null);
  const surfaceLockRef = useRef<SurfaceLock | null>(null);
  const lockedSurfaceSnapshotRef = useRef<LockedSurfaceSnapshot | null>(null);
  const lockedSurfaceCacheRef = useRef<WindowSurface | null>(null);

  const { surfaces, surfacesRef } = useCompanionWindowSurfaces(isReady);

  useEffect(() => {
    desktopBoundsRef.current = desktopBounds;
  }, [desktopBounds]);

  useEffect(() => {
    surfaceLockRef.current = surfaceLock;
  }, [surfaceLock]);

  const getLockedSurface = useCallback((): WindowSurface | null => {
    const lock = surfaceLockRef.current;
    if (!lock) {
      return null;
    }

    if (isScreenEdgeHwnd(lock.hwnd)) {
      return lockedSurfaceCacheRef.current;
    }

    const hwnd = lock.hwnd;
    const fromPoll = findSurfaceByHwnd(surfacesRef.current, hwnd);

    if (fromPoll) {
      lockedSurfaceCacheRef.current = fromPoll;
      return fromPoll;
    }

    return lockedSurfaceCacheRef.current;
  }, [surfacesRef]);

  const getHorizontalBounds = useCallback((): {
    minX: number;
    maxX: number;
  } | null => {
    const lock = surfaceLockRef.current;
    const lockedSurface = getLockedSurface();

    if (lockedSurface && lock && isTitleBarLock(lock.kind)) {
      return getSurfaceHorizontalRange(lockedSurface);
    }

    const bounds = desktopBoundsRef.current;
    if (!bounds) {
      return null;
    }

    return getDesktopHorizontalRange(bounds);
  }, [getLockedSurface]);

  const resolveFloorYAtPosition = useCallback(
    (x: number, y: number): number => {
      const bounds = desktopBoundsRef.current;
      if (!bounds) {
        return y;
      }

      return resolveFloorYAt(
        x,
        y,
        bounds.monitors,
        getLockedSurface(),
        surfaceLockRef.current,
        usesTitleBarSitAnchorRef?.current ?? false,
      );
    },
    [getLockedSurface, usesTitleBarSitAnchorRef],
  );

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

  const clampLockedPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const lock = surfaceLockRef.current;
      const lockedSurface = getLockedSurface();

      if (lockedSurface && lock && isWallLock(lock.kind)) {
        return clampWallAnchorPosition(lockedSurface, lock.kind, y);
      }

      const walled = clampToWallsPosition(x, y);

      return {
        x: walled.x,
        y: resolveFloorYAtPosition(walled.x, walled.y),
      };
    },
    [clampToWallsPosition, getLockedSurface, resolveFloorYAtPosition],
  );

  const clampGroundedPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const lock = surfaceLockRef.current;

      if (lock && isWallLock(lock.kind)) {
        return clampLockedPosition(x, y);
      }

      const walled = clampToWallsPosition(x, y);

      return {
        x: walled.x,
        y: resolveFloorYAtPosition(walled.x, walled.y),
      };
    },
    [clampLockedPosition, clampToWallsPosition, resolveFloorYAtPosition],
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
          : mode === "locked"
            ? clampLockedPosition(position.x, position.y)
            : clampGroundedPosition(position.x, position.y);

      anchorRef.current = nextPosition;
      setAnchorXState(nextPosition.x);
      setAnchorYState(nextPosition.y);

      await setCompanionPosition(nextPosition);
    },
    [clampGroundedPosition, clampLockedPosition, clampToWallsPosition],
  );

  const clearSurfaceLock = useCallback(() => {
    surfaceLockRef.current = null;
    lockedSurfaceSnapshotRef.current = null;
    lockedSurfaceCacheRef.current = null;
    setSurfaceLock(null);
  }, []);

  const tryLockSurfaceAt = useCallback(
    async (x: number, y: number): Promise<SurfaceLock | null> => {
      try {
        const titleBar = await hitTitleBarAt(x, y);
        if (titleBar) {
          const lock = surfaceLockFromTitleBar(titleBar.hwnd);
          lockedSurfaceCacheRef.current = titleBar;
          surfaceLockRef.current = lock;
          lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(titleBar);
          setSurfaceLock(lock);
          return lock;
        }

        const wall = await hitWindowWallAt(x, y);
        if (wall) {
          const wallSurface = windowSurfaceFromWallHit(wall);
          const lock = surfaceLockFromWall(wall);
          lockedSurfaceCacheRef.current = wallSurface;
          surfaceLockRef.current = lock;
          lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(wallSurface);
          setSurfaceLock(lock);
          return lock;
        }

        const bounds = desktopBoundsRef.current;
        if (bounds) {
          const screenEdge = hitScreenEdgeWallAt(x, y, bounds);
          if (screenEdge) {
            const edgeSurface = screenEdgeSurfaceFromWallHit(screenEdge);
            const lock = surfaceLockFromWall(screenEdge);
            lockedSurfaceCacheRef.current = edgeSurface;
            surfaceLockRef.current = lock;
            lockedSurfaceSnapshotRef.current =
              toLockedSurfaceSnapshot(edgeSurface);
            setSurfaceLock(lock);
            return lock;
          }
        }

        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (surfaceLock === null) {
      lockedSurfaceSnapshotRef.current = null;
      return;
    }

    // monitor edges don't move — lock stays until drag clears it
    if (isScreenEdgeHwnd(surfaceLock.hwnd)) {
      return;
    }

    const lockedSurface = findSurfaceByHwnd(surfaces, surfaceLock.hwnd);

    // wait for the first surface poll before deciding the host window is gone
    if (!lockedSurface) {
      if (surfaces.length === 0) {
        return;
      }

      clearSurfaceLock();
      onSurfaceLockLostRef.current?.();
      return;
    }

    const previousSnapshot = lockedSurfaceSnapshotRef.current;
    if (!previousSnapshot) {
      lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(lockedSurface);
      return;
    }

    if (hasLockedSurfaceMoved(previousSnapshot, lockedSurface)) {
      clearSurfaceLock();
      onSurfaceLockLostRef.current?.();
      return;
    }

    lockedSurfaceSnapshotRef.current = toLockedSurfaceSnapshot(lockedSurface);
  }, [clearSurfaceLock, surfaceLock, surfaces]);

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
      const lock = surfaceLockRef.current;
      if (lock && isWallLock(lock.kind)) {
        return false;
      }

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

  const moveByY = useCallback(
    (deltaY: number): boolean => {
      const lock = surfaceLockRef.current;
      const lockedSurface = getLockedSurface();

      if (!lock || !lockedSurface || !isWallLock(lock.kind)) {
        return false;
      }

      const current = anchorRef.current;
      const nextY = clampWallAnchorY(lockedSurface, current.y + deltaY);

      if (nextY === current.y && Math.abs(deltaY) > 0) {
        return false;
      }

      void applyAnchorPosition(
        clampWallAnchorPosition(lockedSurface, lock.kind, nextY),
        "locked",
      );

      return true;
    },
    [applyAnchorPosition, getLockedSurface],
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

  const getVerticalClimbRange = useCallback((): {
    minY: number;
    maxY: number;
  } | null => {
    const lock = surfaceLockRef.current;
    const lockedSurface = getLockedSurface();

    if (!lock || !lockedSurface || !isWallLock(lock.kind)) {
      return null;
    }

    return getWallVerticalRange(lockedSurface);
  }, [getLockedSurface]);

  return {
    desktopBounds,
    anchorX,
    anchorY,
    isReady,
    surfaceLock,
    isSurfaceLocked: surfaceLock !== null,
    isWallLocked:
      surfaceLock !== null &&
      (surfaceLock.kind === "wallLeft" || surfaceLock.kind === "wallRight"),
    moveBy,
    moveByY,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls: clampToWallsPosition,
    clampAnchorPosition: clampGroundedPosition,
    getFloorYAt: resolveFloorYAtPosition,
    getAnchorPosition,
    getHorizontalWalkRange,
    getVerticalClimbRange,
    clearSurfaceLock,
    tryLockSurfaceAt,
  };
}
