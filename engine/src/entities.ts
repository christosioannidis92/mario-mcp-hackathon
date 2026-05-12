import type { Level, EnemyType } from "./types";
import { TILE_SIZE, PLAYER_W, PLAYER_H, MAX_JUMPS } from "./constants";

export interface Player {
  x: number;          // world px — top-left of AABB
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  onGround: boolean;
  coyoteMs: number;       // counts down while airborne after walking off a ledge
  jumpBufferMs: number;   // counts down after a jump press while airborne
  jumpsLeft: number;      // counts down per jump; refills to MAX_JUMPS on land
  facing: 1 | -1;
}

// Runtime enemy state. Pixel-space position so they can walk smoothly.
// Built from level.enemies (tile-unit) on every loadLevel/reset.
// Size varies per type (kiosk is 2 tiles tall).
export interface RuntimeEnemy {
  x: number;          // world px — top-left of AABB
  y: number;
  w: number;          // AABB width
  h: number;          // AABB height
  vx: number;         // px/s — 0 for stationary (piranha, kiosk)
  type: EnemyType;
  alive: boolean;
}

const ENEMY_SPEED: Record<EnemyType, number> = {
  goomba:  40,
  koopa:   60,
  piranha:  0,   // stationary on top of its pipe
  kiosk:    0,   // stationary ground hazard (parking-meter cameo)
};

// Per-enemy AABB size in pixels. Width fixed at TILE_SIZE; height varies.
// Tall enemies are bottom-anchored to the row they're placed in (e.y in JSON).
export const ENEMY_SIZE: Record<EnemyType, { w: number; h: number }> = {
  goomba:  { w: TILE_SIZE, h: TILE_SIZE },
  koopa:   { w: TILE_SIZE, h: TILE_SIZE },
  piranha: { w: TILE_SIZE, h: TILE_SIZE },
  kiosk:   { w: TILE_SIZE, h: TILE_SIZE * 3 },  // 3 tiles tall — imposing
};

// Whether a stomp from above kills the enemy. False → contact always damages.
export const ENEMY_STOMPABLE: Record<EnemyType, boolean> = {
  goomba:  true,
  koopa:   true,
  piranha: false,  // sharp top
  kiosk:   false,  // metal box, won't squish
};

export function createPlayer(start: { x: number; y: number }): Player {
  // playerStart is in tile units. Bottom-align the AABB inside the starting tile,
  // horizontally centered. Gravity drops the player onto the ground naturally.
  return {
    x: start.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2,
    y: start.y * TILE_SIZE + (TILE_SIZE - PLAYER_H),
    vx: 0,
    vy: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    onGround: false,
    coyoteMs: 0,
    jumpBufferMs: 0,
    jumpsLeft: MAX_JUMPS,
    facing: 1,
  };
}

export function createEnemies(level: Level): RuntimeEnemy[] {
  return level.enemies.map((e) => {
    const size = ENEMY_SIZE[e.type];
    return {
      x: e.x * TILE_SIZE,
      // Bottom-anchored: tall enemies extend UP from their placement row.
      y: e.y * TILE_SIZE + TILE_SIZE - size.h,
      w: size.w,
      h: size.h,
      vx: ENEMY_SPEED[e.type],
      type: e.type,
      alive: true,
    };
  });
}
