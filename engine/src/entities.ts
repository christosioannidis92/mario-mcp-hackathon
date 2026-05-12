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
