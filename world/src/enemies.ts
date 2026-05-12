// Pure enemy behaviour. Optional for v1 — engine/SPEC.md §1 lists stomp/shell/
// piranha as non-goals and treats enemies as static obstacles. This module
// exists so PR1 can plug in walking enemies as a stretch goal without
// rewriting their physics loop.
//
// All units are TILE-SPACE: x,y are tile coordinates (fractional), vx in
// tiles/second. PR1 multiplies by TILE_SIZE at the rendering boundary.

import { EnemyType, Level, SOLID_TILES } from "./types.js";

export interface EnemyRuntime {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  facing: -1 | 1;
  alive: boolean;
}

export const GOOMBA_SPEED = 2;   // tiles/s
export const KOOPA_SPEED = 2.5;  // tiles/s

let runtimeIdCounter = 0;

export function spawnRuntime(level: Level): EnemyRuntime[] {
  return level.enemies.map((e) => {
    runtimeIdCounter += 1;
    const speed =
      e.type === "goomba" ? GOOMBA_SPEED : e.type === "koopa" ? KOOPA_SPEED : 0;
    return {
      id: runtimeIdCounter,
      type: e.type,
      x: e.x + 0.5,
      y: e.y + 0.5,
      vx: -speed,
      facing: -1,
      alive: true,
    };
  });
}

export function isSolidAt(level: Level, tx: number, ty: number): boolean {
  if (ty < 0 || ty >= level.height) return false;
  if (tx < 0 || tx >= level.width) return true; // off-map sides are walls
  const t = level.tiles[ty]?.[tx];
  return t ? SOLID_TILES.has(t) : false;
}

// Walk left/right at constant speed; reverse on wall or (for koopa) ledge.
// Gravity is the engine's responsibility — this function only handles the
// horizontal AI. Piranha plants are not animated here.
export function updateWalker(
  e: EnemyRuntime,
  level: Level,
  dt: number,
): EnemyRuntime {
  if (!e.alive || e.type === "piranha") return e;
  const speed = e.type === "goomba" ? GOOMBA_SPEED : KOOPA_SPEED;
  const vx = e.facing * speed;
  const nextX = e.x + vx * dt;

  // Wall probe at body height.
  const wallX = Math.floor(nextX + e.facing * 0.5);
  const bodyY = Math.floor(e.y);
  if (isSolidAt(level, wallX, bodyY)) {
    return { ...e, facing: (e.facing * -1) as -1 | 1, vx: -vx };
  }

  // Ledge probe: koopa turns at a ledge, goomba walks off it (classic).
  if (e.type === "koopa") {
    const groundProbeX = Math.floor(nextX + e.facing * 0.5);
    const groundProbeY = Math.floor(e.y + 0.6);
    if (!isSolidAt(level, groundProbeX, groundProbeY)) {
      return { ...e, facing: (e.facing * -1) as -1 | 1, vx: -vx };
    }
  }

  return { ...e, x: nextX, vx };
}

export function killEnemy(e: EnemyRuntime): EnemyRuntime {
  return { ...e, alive: false, vx: 0 };
}

export function damagesPlayer(e: EnemyRuntime): boolean {
  return e.alive;
}
