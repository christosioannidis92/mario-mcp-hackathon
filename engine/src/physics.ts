import type { Level } from "./types";
import { SOLID_TILES } from "./types";
import type { Input } from "./input";
import type { Player, RuntimeEnemy } from "./entities";
import {
  TILE_SIZE,
  GRAVITY, MAX_FALL_V,
  RUN_SPEED, RUN_ACCEL, RUN_FRICTION,
  JUMP_V0, JUMP_CUT_V,
  COYOTE_MS, JUMP_BUFFER_MS,
} from "./constants";

export type Trigger = "flag" | "coin" | null;

export function stepPlayer(p: Player, input: Input, level: Level, dt: number): void {
  const dtMs = dt * 1000;

  // --- Horizontal velocity ---
  if (input.left && !input.right) {
    p.vx -= RUN_ACCEL * dt;
    p.facing = -1;
  } else if (input.right && !input.left) {
    p.vx += RUN_ACCEL * dt;
    p.facing = 1;
  } else {
    p.vx = approachZero(p.vx, RUN_FRICTION * dt);
  }
  if (p.vx >  RUN_SPEED) p.vx =  RUN_SPEED;
  if (p.vx < -RUN_SPEED) p.vx = -RUN_SPEED;

  // --- Gravity ---
  p.vy += GRAVITY * dt;
  if (p.vy > MAX_FALL_V) p.vy = MAX_FALL_V;

  // --- Jump press: instant if grounded or in coyote window, else buffered ---
  if (input.jumpPressed) {
    if (p.onGround || p.coyoteMs > 0) {
      p.vy = -JUMP_V0;
      p.onGround = false;
      p.coyoteMs = 0;
      p.jumpBufferMs = 0;
    } else {
      p.jumpBufferMs = JUMP_BUFFER_MS;
    }
  } else {
    p.jumpBufferMs = Math.max(0, p.jumpBufferMs - dtMs);
  }

  // --- Variable jump height: cut upward velocity on early release ---
  if (input.jumpReleased && p.vy < -JUMP_CUT_V) {
    p.vy = -JUMP_CUT_V;
  }

  // --- Move + resolve per axis ---
  p.x += p.vx * dt;
  resolveX(p, level);

  const wasOnGround = p.onGround;
  p.onGround = false;
  p.y += p.vy * dt;
  resolveY(p, level);

  // --- Coyote: just walked off a ledge this step ---
  if (wasOnGround && !p.onGround) {
    p.coyoteMs = COYOTE_MS;
  } else if (!p.onGround) {
    p.coyoteMs = Math.max(0, p.coyoteMs - dtMs);
  }

  // --- Buffered jump consumed on landing ---
  if (p.onGround && p.jumpBufferMs > 0) {
    p.vy = -JUMP_V0;
    p.onGround = false;
    p.jumpBufferMs = 0;
  }
}

// --- Triggers (flag wins; coin is a no-op in v1) ---
export function checkTriggers(p: Player, level: Level): Trigger {
  const x0 = Math.floor(p.x / TILE_SIZE);
  const x1 = Math.floor((p.x + p.w - 1) / TILE_SIZE);
  const y0 = Math.floor(p.y / TILE_SIZE);
  const y1 = Math.floor((p.y + p.h - 1) / TILE_SIZE);

  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= level.height) continue;
    for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || tx >= level.width) continue;
      const t = level.tiles[ty][tx];
      if (t === "flag") return "flag";
      if (t === "coin") return "coin";
    }
  }
  return null;
}

// --- Enemy contact (runtime AABBs, one tile each) ---
export function checkEnemyHit(p: Player, enemies: RuntimeEnemy[]): boolean {
  for (const e of enemies) {
    if (!e.alive) continue;
    if (
      p.x < e.x + TILE_SIZE &&
      p.x + p.w > e.x &&
      p.y < e.y + TILE_SIZE &&
      p.y + p.h > e.y
    ) {
      return true;
    }
  }
  return false;
}

// --- Enemy walking. Horizontal only. Flips on wall collision or ledge edge. ---
export function stepEnemies(enemies: RuntimeEnemy[], level: Level, dt: number): void {
  for (const e of enemies) {
    if (!e.alive || e.vx === 0) continue;
    const dir = Math.sign(e.vx);
    // Probe one pixel beyond the leading edge.
    const probePx = dir > 0 ? e.x + TILE_SIZE : e.x - 1;
    const tileX = Math.floor(probePx / TILE_SIZE);
    const tileY = Math.floor((e.y + TILE_SIZE / 2) / TILE_SIZE);

    const aheadTile = level.tiles[tileY]?.[tileX];
    const wallBlocked = aheadTile !== undefined && SOLID_TILES.has(aheadTile);

    // Ledge check: tile immediately below the probe position.
    const belowY = tileY + 1;
    let ledgeAhead: boolean;
    if (belowY >= level.height) {
      ledgeAhead = true;
    } else {
      const belowTile = level.tiles[belowY]?.[tileX];
      ledgeAhead = belowTile === undefined || !SOLID_TILES.has(belowTile);
    }

    if (wallBlocked || ledgeAhead) {
      e.vx = -e.vx;
      continue;
    }
    e.x += e.vx * dt;
  }
}

// --- Fall-off-the-bottom death ---
export function checkDeath(p: Player, level: Level): boolean {
  return p.y > level.height * TILE_SIZE + 64;
}

// ---------------- internals ----------------

function approachZero(v: number, delta: number): number {
  if (v > 0) return Math.max(0, v - delta);
  if (v < 0) return Math.min(0, v + delta);
  return 0;
}

// Per-axis AABB-vs-tile-grid resolution.
// Resolution is symmetric for both axes; the only thing that differs is which face we snap to.

function resolveX(p: Player, level: Level): void {
  if (p.vx === 0) return;
  const movingRight = p.vx > 0;
  const tiles = collectSolidColumns(p, level);
  if (tiles.length === 0) return;
  if (movingRight) {
    let minTx = Infinity;
    for (const t of tiles) if (t.x < minTx) minTx = t.x;
    p.x = minTx * TILE_SIZE - p.w;
  } else {
    let maxTx = -Infinity;
    for (const t of tiles) if (t.x > maxTx) maxTx = t.x;
    p.x = (maxTx + 1) * TILE_SIZE;
  }
  p.vx = 0;
}

function resolveY(p: Player, level: Level): void {
  if (p.vy === 0) return;
  const movingDown = p.vy > 0;
  const tiles = collectSolidColumns(p, level);
  if (tiles.length === 0) return;
  if (movingDown) {
    let minTy = Infinity;
    for (const t of tiles) if (t.y < minTy) minTy = t.y;
    p.y = minTy * TILE_SIZE - p.h;
    p.onGround = true;
  } else {
    let maxTy = -Infinity;
    for (const t of tiles) if (t.y > maxTy) maxTy = t.y;
    p.y = (maxTy + 1) * TILE_SIZE;
  }
  p.vy = 0;
}

// Returns every solid tile (or out-of-bounds wall/ceiling) overlapping the player AABB.
// Left, right, and top OOB are treated as solid walls. Bottom OOB is non-solid → fall to death.
function collectSolidColumns(p: Player, level: Level): { x: number; y: number }[] {
  const x0 = Math.floor(p.x / TILE_SIZE);
  const x1 = Math.floor((p.x + p.w - 1) / TILE_SIZE);
  const y0 = Math.floor(p.y / TILE_SIZE);
  const y1 = Math.floor((p.y + p.h - 1) / TILE_SIZE);
  const out: { x: number; y: number }[] = [];

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const oobX = tx < 0 || tx >= level.width;
      const oobTop = ty < 0;
      const oobBottom = ty >= level.height;
      if (oobX || oobTop) { out.push({ x: tx, y: ty }); continue; }
      if (oobBottom) continue;  // bottom is open
      const t = level.tiles[ty][tx];
      if (SOLID_TILES.has(t)) out.push({ x: tx, y: ty });
    }
  }
  return out;
}
