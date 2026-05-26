import { useCallback, useEffect, useRef, useState } from "react";
import { getDesktopBounds, setCompanionPosition } from "../services/companionApi";
import type {
  AnchorClampMode,
  DesktopBounds,
  ScreenPosition,
} from "../types/companion";
import {
  clampToDesktopWalls,
  getFloorYAt,
  getRightmostMonitorFloorStart,
} from "../utils/monitorBounds";

interface UseCompanionMovementResult {
  desktopBounds: DesktopBounds | null;
  anchorX: number;
  anchorY: number;
  isReady: boolean;
  moveBy: (deltaX: number) => void;
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
}

export function useCompanionMovement(): UseCompanionMovementResult {
  const [desktopBounds, setDesktopBounds] = useState<DesktopBounds | null>(
    null,
  );
  const [anchorX, setAnchorXState] = useState(0);
  const [anchorY, setAnchorYState] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const anchorRef = useRef<ScreenPosition>({ x: 0, y: 0 });
  const desktopBoundsRef = useRef<DesktopBounds | null>(null);

  useEffect(() => {
    desktopBoundsRef.current = desktopBounds;
  }, [desktopBounds]);

  const resolveFloorYAt = useCallback((x: number, y: number): number => {
    const bounds = desktopBoundsRef.current;
    if (!bounds) {
      return y;
    }

    return getFloorYAt(x, y, bounds.monitors);
  }, []);

  const clampToWallsPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const bounds = desktopBoundsRef.current;
      if (!bounds) {
        return { x, y };
      }

      return clampToDesktopWalls(x, y, bounds);
    },
    [],
  );

  const clampGroundedPosition = useCallback(
    (x: number, y: number): ScreenPosition => {
      const walled = clampToWallsPosition(x, y);

      return {
        x: walled.x,
        y: resolveFloorYAt(walled.x, walled.y),
      };
    },
    [clampToWallsPosition, resolveFloorYAt],
  );

  const clampAnchorX = useCallback(
    (x: number): number => {
      return clampToWallsPosition(x, anchorRef.current.y).x;
    },
    [clampToWallsPosition],
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
    (deltaX: number) => {
      const current = anchorRef.current;
      void applyAnchorPosition(
        {
          x: current.x + deltaX,
          y: current.y,
        },
        "grounded",
      );
    },
    [applyAnchorPosition],
  );

  const setAnchorX = useCallback(
    async (nextX: number) => {
      const current = anchorRef.current;
      await applyAnchorPosition({ x: nextX, y: current.y }, "grounded");
    },
    [applyAnchorPosition],
  );

  const setAnchorPosition = useCallback(
    async (position: ScreenPosition, mode: AnchorClampMode = "grounded") => {
      await applyAnchorPosition(position, mode);
    },
    [applyAnchorPosition],
  );

  return {
    desktopBounds,
    anchorX,
    anchorY,
    isReady,
    moveBy,
    setAnchorX,
    setAnchorPosition,
    clampAnchorX,
    clampToWalls: clampToWallsPosition,
    clampAnchorPosition: clampGroundedPosition,
    getFloorYAt: resolveFloorYAt,
    getAnchorPosition,
  };
}
