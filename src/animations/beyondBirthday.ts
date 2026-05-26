import type { AnimationDefinition, CompanionAction } from "./types";

export const COMPANION_ASSET_BASE = "/companion/beyond-birthday";

// shimeji anchor: feet at bottom-center of the 128x128 sprite
export const SPRITE_WIDTH = 128;
export const SPRITE_HEIGHT = 128;
export const SPRITE_ANCHOR = { x: 64, y: 128 } as const;

// ~25ms per tick matches the shimeji engine cadence
export const TICK_INTERVAL_MS = 25;

export const LANDING_THRESHOLD = 4;

// fall physics from shimeji xml — gravity bumped a bit for snappier drops
export const FALL_GRAVITY = 3;
export const FALL_AIR_RESISTANCE_X = 0.05;
export const FALL_AIR_RESISTANCE_Y = 0.05;

// ported from public/Beyond Birthday/conf/動作.xml
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

// grabbed lean thresholds in px/tick (25ms cadence)
export const GRAB_VELOCITY_STRONG = 6;
export const GRAB_VELOCITY_MILD = 2;

// grabbed uses dynamic frame selection via getGrabbedFrameFromVelocity
export const GRABBED_ANIMATION: AnimationDefinition = {
  frames: ["shime1.png"],
  tickDuration: 5,
  velocity: { x: 0, y: 0 },
};

const ANIMATION_BY_ACTION: Record<CompanionAction, AnimationDefinition> = {
  idle: IDLE_ANIMATION,
  walk: WALK_ANIMATION,
  grabbed: GRABBED_ANIMATION,
  resist: RESIST_ANIMATION,
  fall: FALL_ANIMATION,
  bounce: BOUNCE_ANIMATION,
};

export function getAnimationForAction(
  action: CompanionAction,
): AnimationDefinition {
  return ANIMATION_BY_ACTION[action];
}

// lean opposes drag direction — same feel as shimeji footX vs cursor offset
export function getGrabbedFrameFromVelocity(velocityX: number): string {
  const leanVelocity = -velocityX;

  if (leanVelocity < -GRAB_VELOCITY_STRONG) {
    return "shime9.png";
  }

  if (leanVelocity < -GRAB_VELOCITY_MILD) {
    return "shime7.png";
  }

  if (leanVelocity > GRAB_VELOCITY_STRONG) {
    return "shime10.png";
  }

  if (leanVelocity > GRAB_VELOCITY_MILD) {
    return "shime8.png";
  }

  return "shime1.png";
}

export function getFramePath(frame: string): string {
  return `${COMPANION_ASSET_BASE}/${frame}`;
}
