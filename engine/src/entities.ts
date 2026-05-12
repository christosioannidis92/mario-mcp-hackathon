import type { Level, EnemyType } from "./types";
import { TILE_SIZE, PLAYER_W, PLAYER_H } from "./constants";

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
  facing: 1 | -1;
}

// Runtime enemy state. Pixel-space position so they can walk smoothly.
// Built from level.enemies (tile-unit) on every loadLevel/reset.
export interface RuntimeEnemy {
  x: number;          // world px — top-left of 32×32 AABB
  y: number;
  vx: number;         // px/s — 0 for stationary (piranha)
  type: EnemyType;
  alive: boolean;
}

const ENEMY_SPEED: Record<EnemyType, number> = {
  goomba:  40,
  koopa:   60,
  piranha:  0,   // stationary on top of its pipe
  kiosk:    0,   // stationary ground hazard (parking-meter cameo)
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
    facing: 1,
  };
}

export function createEnemies(level: Level): RuntimeEnemy[] {
  return level.enemies.map((e) => ({
    x: e.x * TILE_SIZE,
    y: e.y * TILE_SIZE,
    vx: ENEMY_SPEED[e.type],
    type: e.type,
    alive: true,
  }));
}
