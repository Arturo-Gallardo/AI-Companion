import type {
  AnimationDefinition,
  CompanionAction,
  GrabbedLeanTier,
  SpriteAnchor,
} from "./types";
import type { SurfaceLock } from "../types/companion";

// default sprite geometry ratios for anchor math shared across all characters
export const SPRITE_WIDTH = 128;
export const SPRITE_HEIGHT = 128;
export const SPRITE_ANCHOR = { x: 64, y: 128 } as const;

// title bar sit — butt on the bar, legs/feet hang below
export const TITLE_BAR_SIT_ANCHOR = { x: 64, y: 112 } as const;
export const TITLE_BAR_SIT_Y_OFFSET = SPRITE_ANCHOR.y - TITLE_BAR_SIT_ANCHOR.y;

// window underside crawl
export const UNDERSIDE_GRAB_ANCHOR = { x: 64, y: 48 } as const;

// ~25ms per tick matches the shimeji engine cadence
export const TICK_INTERVAL_MS = 25;

export const LANDING_THRESHOLD = 4;

// fall physics from shimeji xml — gravity bumped a bit for snappier drops
export const FALL_GRAVITY = 3;
export const FALL_AIR_RESISTANCE_X = 0.05;
export const FALL_AIR_RESISTANCE_Y = 0.05;

export function getFrameTickDuration(
  animation: AnimationDefinition,
  frameIndex: number,
): number {
  const perFrame = animation.frameTickDurations?.[frameIndex];
  return perFrame ?? animation.tickDuration;
}

// grabbed lean reference thresholds in px/tick (25ms cadence)
export const GRAB_VELOCITY_STRONG = 6;
export const GRAB_VELOCITY_MILD = 2;

// hysteresis — enter higher, exit lower so slow drags dont flicker tiers
export const GRAB_EXIT_LIGHT = 0.5;
export const GRAB_ENTER_MILD = 2.5;
export const GRAB_EXIT_MILD = 1;
export const GRAB_ENTER_STRONG = 6.5;
export const GRAB_EXIT_STRONG = 4.5;

export type { GrabbedLeanTier } from "./types";

export function usesTitleBarSitAnchor(action: CompanionAction): boolean {
  return action === "sitOnBar" || action === "dangleOnBar";
}

export function usesUndersideGrabAnchor(action: CompanionAction): boolean {
  return action === "grabCeiling" || action === "climbCeiling";
}

// when locked to a surface, swap floor actions for perched / wall poses
export function resolveDisplayAction(
  action: CompanionAction,
  surfaceLock: SurfaceLock | null,
): CompanionAction {
  if (!surfaceLock) {
    return action;
  }

  if (
    surfaceLock.kind === "titleBar" &&
    (action === "sit" || action === "sitAlt" || action === "sitAlt2")
  ) {
    return "dangleOnBar";
  }

  if (surfaceLock.kind === "wallLeft" || surfaceLock.kind === "wallRight") {
    if (action === "climbWall" || action === "climbWallDown") {
      return action;
    }

    return "grabWall";
  }

  if (surfaceLock.kind === "underside") {
    if (action === "climbCeiling") {
      return action;
    }

    if (action === "idle" || action === "walk") {
      return "grabCeiling";
    }
  }

  return action;
}

export function getSpriteAnchorForAction(
  action: CompanionAction,
): SpriteAnchor {
  if (usesTitleBarSitAnchor(action)) {
    return TITLE_BAR_SIT_ANCHOR;
  }

  if (usesUndersideGrabAnchor(action)) {
    return UNDERSIDE_GRAB_ANCHOR;
  }

  return SPRITE_ANCHOR;
}

function lightTierFromLean(lean: number): GrabbedLeanTier {
  return lean < 0 ? "lightLeft" : "lightRight";
}

// lean opposes drag direction — same feel as shimeji footX vs cursor offset
export function resolveGrabbedLeanTier(
  previous: GrabbedLeanTier,
  velocityX: number,
): GrabbedLeanTier {
  const lean = -velocityX;

  switch (previous) {
    case "strongLeft":
      if (lean > -GRAB_EXIT_STRONG) {
        if (lean > -GRAB_EXIT_MILD) {
          return lean > GRAB_EXIT_LIGHT
            ? "lightRight"
            : lightTierFromLean(lean);
        }
        return "mildLeft";
      }
      return "strongLeft";

    case "mildLeft":
      if (lean < -GRAB_ENTER_STRONG) {
        return "strongLeft";
      }
      if (lean > -GRAB_EXIT_MILD) {
        return lean > GRAB_EXIT_LIGHT ? "lightRight" : "lightLeft";
      }
      return "mildLeft";

    case "lightLeft":
      if (lean < -GRAB_ENTER_STRONG) {
        return "strongLeft";
      }
      if (lean < -GRAB_ENTER_MILD) {
        return "mildLeft";
      }
      if (lean > GRAB_EXIT_LIGHT) {
        return "lightRight";
      }
      return "lightLeft";

    case "strongRight":
      if (lean < GRAB_EXIT_STRONG) {
        if (lean < GRAB_EXIT_MILD) {
          return lean < -GRAB_EXIT_LIGHT ? "lightLeft" : "lightRight";
        }
        return "mildRight";
      }
      return "strongRight";

    case "mildRight":
      if (lean > GRAB_ENTER_STRONG) {
        return "strongRight";
      }
      if (lean < GRAB_EXIT_MILD) {
        return lean < -GRAB_EXIT_LIGHT ? "lightLeft" : "lightRight";
      }
      return "mildRight";

    case "lightRight":
      if (lean > GRAB_ENTER_STRONG) {
        return "strongRight";
      }
      if (lean > GRAB_ENTER_MILD) {
        return "mildRight";
      }
      if (lean < -GRAB_EXIT_LIGHT) {
        return "lightLeft";
      }
      return "lightRight";
  }
}
