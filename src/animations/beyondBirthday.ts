import type {
  AnimationDefinition,
  CompanionAction,
  GrabbedLeanTier,
  SpriteAnchor,
} from "./types";
import type { SurfaceLock } from "../types/companion";

export const COMPANION_ASSET_BASE = "/companion/beyond-birthday";

// shimeji anchor: feet at bottom-center of the 128x128 sprite
export const SPRITE_WIDTH = 128;
export const SPRITE_HEIGHT = 128;
export const SPRITE_ANCHOR = { x: 64, y: 128 } as const;

// title bar sit — butt on the bar, legs/feet hang below (shime31–33)
export const TITLE_BAR_SIT_ANCHOR = { x: 64, y: 112 } as const;
export const TITLE_BAR_SIT_Y_OFFSET = SPRITE_ANCHOR.y - TITLE_BAR_SIT_ANCHOR.y;

// window underside crawl — same sprites as shimeji ceiling crawl (shime23–25)
export const UNDERSIDE_GRAB_ANCHOR = { x: 64, y: 48 } as const;

// ~25ms per tick matches the shimeji engine cadence
export const TICK_INTERVAL_MS = 25;

export const LANDING_THRESHOLD = 4;

// fall physics from shimeji xml — gravity bumped a bit for snappier drops
export const FALL_GRAVITY = 3;
export const FALL_AIR_RESISTANCE_X = 0.05;
export const FALL_AIR_RESISTANCE_Y = 0.05;

// animation timings ported from original shimeji 動作.xml
export const IDLE_ANIMATION: AnimationDefinition = {
  frames: ["shime1.png"],
  tickDuration: 6,
  velocity: { x: 0, y: 0 },
};

export const WALK_ANIMATION: AnimationDefinition = {
  frames: ["shime1.png", "shime2.png", "shime1.png", "shime3.png"],
  tickDuration: 6,
  velocity: { x: -2, y: 0 },
};

export const FALL_ANIMATION: AnimationDefinition = {
  frames: ["shime4.png"],
  tickDuration: 250,
  velocity: { x: 0, y: 0 },
};

export const BOUNCE_ANIMATION: AnimationDefinition = {
  frames: ["shime18.png", "shime19.png"],
  tickDuration: 4,
  velocity: { x: 0, y: 0 },
};

export const RESIST_ANIMATION: AnimationDefinition = {
  frames: ["shime5.png", "shime6.png"],
  tickDuration: 5,
  velocity: { x: 0, y: 0 },
};

// sit — single pose held still (Beyond Birthday default: shime15)
export const SIT_ANIMATION: AnimationDefinition = {
  frames: ["shime15.png"],
  tickDuration: 250,
  velocity: { x: 0, y: 0 },
};

// perched on a window title bar — legs dangle in front for a 3d look
export const TITLE_BAR_SIT_ANIMATION: AnimationDefinition = {
  frames: ["shime31.png"],
  tickDuration: 250,
  velocity: { x: 0, y: 0 },
};

export const TITLE_BAR_DANGLE_ANIMATION: AnimationDefinition = {
  frames: ["shime31.png", "shime32.png", "shime31.png", "shime33.png"],
  tickDuration: 5,
  frameTickDurations: [5, 15, 5, 15],
  velocity: { x: 0, y: 0 },
};

// clinging to a window wall — shimeji GrabWall / ClimbWall
export const GRAB_WALL_ANIMATION: AnimationDefinition = {
  frames: ["shime13.png"],
  tickDuration: 250,
  velocity: { x: 0, y: 0 },
};

export const CLIMB_WALL_UP_ANIMATION: AnimationDefinition = {
  frames: ["shime14.png", "shime12.png", "shime13.png", "shime13.png"],
  tickDuration: 4,
  frameTickDurations: [16, 4, 4, 4],
  velocity: { x: 0, y: -2 },
};

export const CLIMB_WALL_DOWN_ANIMATION: AnimationDefinition = {
  frames: ["shime14.png", "shime12.png", "shime13.png", "shime13.png"],
  tickDuration: 4,
  frameTickDurations: [16, 4, 4, 4],
  velocity: { x: 0, y: 2 },
};

export const GRAB_UNDERSIDE_ANIMATION: AnimationDefinition = {
  frames: ["shime23.png"],
  tickDuration: 250,
  velocity: { x: 0, y: 0 },
};

export const CRAWL_UNDERSIDE_ANIMATION: AnimationDefinition = {
  frames: [
    "shime25.png",
    "shime25.png",
    "shime23.png",
    "shime24.png",
    "shime24.png",
    "shime24.png",
    "shime23.png",
    "shime25.png",
  ],
  tickDuration: 4,
  frameTickDurations: [16, 4, 4, 16, 4, 4, 4, 4],
  velocity: { x: -2, y: 0 },
};

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
export const GRAB_ENTER_MILD = 2.5;
export const GRAB_EXIT_MILD = 1;
export const GRAB_ENTER_STRONG = 6.5;
export const GRAB_EXIT_STRONG = 4.5;

export type { GrabbedLeanTier } from "./types";

export const DEFAULT_GRABBED_LEAN_FRAME = "shime1.png";

// grabbed uses dynamic frame selection via lean tier hysteresis
export const GRABBED_ANIMATION: AnimationDefinition = {
  frames: ["shime1.png"],
  tickDuration: 5,
  velocity: { x: 0, y: 0 },
};

const ANIMATION_BY_ACTION: Record<CompanionAction, AnimationDefinition> = {
  idle: IDLE_ANIMATION,
  walk: WALK_ANIMATION,
  sit: SIT_ANIMATION,
  sitAlt: SIT_ANIMATION,
  sitAlt2: SIT_ANIMATION,
  sitOnBar: TITLE_BAR_SIT_ANIMATION,
  dangleOnBar: TITLE_BAR_DANGLE_ANIMATION,
  grabWall: GRAB_WALL_ANIMATION,
  climbWall: CLIMB_WALL_UP_ANIMATION,
  climbWallDown: CLIMB_WALL_DOWN_ANIMATION,
  grabCeiling: GRAB_UNDERSIDE_ANIMATION,
  climbCeiling: CRAWL_UNDERSIDE_ANIMATION,
  grabbed: GRABBED_ANIMATION,
  resist: RESIST_ANIMATION,
  fall: FALL_ANIMATION,
  bounce: BOUNCE_ANIMATION,
};

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

export function getSpriteAnchorForAction(action: CompanionAction): SpriteAnchor {
  if (usesTitleBarSitAnchor(action)) {
    return TITLE_BAR_SIT_ANCHOR;
  }

  if (usesUndersideGrabAnchor(action)) {
    return UNDERSIDE_GRAB_ANCHOR;
  }

  return SPRITE_ANCHOR;
}

export function getAnimationForAction(
  action: CompanionAction,
): AnimationDefinition {
  return ANIMATION_BY_ACTION[action];
}

export function getGrabbedFrameFromLeanTier(tier: GrabbedLeanTier): string {
  switch (tier) {
    case "mildLeft":
      return "shime7.png";
    case "strongLeft":
      return "shime9.png";
    case "mildRight":
      return "shime8.png";
    case "strongRight":
      return "shime10.png";
    case "neutral":
    default:
      return DEFAULT_GRABBED_LEAN_FRAME;
  }
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
        return lean > -GRAB_EXIT_MILD ? "neutral" : "mildLeft";
      }
      return "strongLeft";

    case "mildLeft":
      if (lean < -GRAB_ENTER_STRONG) {
        return "strongLeft";
      }
      if (lean > -GRAB_EXIT_MILD) {
        return "neutral";
      }
      return "mildLeft";

    case "strongRight":
      if (lean < GRAB_EXIT_STRONG) {
        return lean < GRAB_EXIT_MILD ? "neutral" : "mildRight";
      }
      return "strongRight";

    case "mildRight":
      if (lean > GRAB_ENTER_STRONG) {
        return "strongRight";
      }
      if (lean < GRAB_EXIT_MILD) {
        return "neutral";
      }
      return "mildRight";

    case "neutral":
    default:
      if (lean < -GRAB_ENTER_MILD) {
        return "mildLeft";
      }
      if (lean > GRAB_ENTER_MILD) {
        return "mildRight";
      }
      return "neutral";
  }
}

export function getGrabbedFrameFromVelocity(velocityX: number): string {
  return getGrabbedFrameFromLeanTier(
    resolveGrabbedLeanTier("neutral", velocityX),
  );
}

export function getFramePath(frame: string): string {
  return `${COMPANION_ASSET_BASE}/${frame}`;
}
