import { chunkWidth, pickChunk } from "./chunks.js";
import {
  DEFAULT_HEIGHT,
  Difficulty,
  GROUND_ROW,
  ToolResult,
} from "./constants.js";
import { createRng, randomSeed } from "./rng.js";
import {
  Enemy,
  EnemyType,
  Level,
  SOLID_TILES,
  Theme,
  TileType,
} from "./types.js";

export interface GenerateLevelOptions {
  theme: Theme;
  difficulty: Difficulty;
  length: number;
  seed?: number;
  id?: string;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function emptyTiles(width: number, height: number): TileType[][] {
  const rows: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    rows.push(new Array<TileType>(width).fill("empty"));
  }
  return rows;
}

function inBounds(level: Level, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < level.width && y < level.height;
}

function cloneLevel(level: Level): Level {
  return {
    ...level,
    tiles: level.tiles.map((row) => row.slice()),
    enemies: level.enemies.map((e) => ({ ...e })),
    playerStart: { ...level.playerStart },
  };
}

// -------- generate_level --------

export function generateLevel(opts: GenerateLevelOptions): Level {
  const height = DEFAULT_HEIGHT;
  const length = Math.max(20, Math.min(opts.length, 400));
  const seed = opts.seed ?? randomSeed();
  const rng = createRng(seed);
  const tiles = emptyTiles(length, height);

  const spawnPad = 4;
  const flagPad = 4;
  const chunkArea = length - spawnPad - flagPad;

  // Spawn pad — flat ground so the player never starts on a chunk seam.
  for (let x = 0; x < spawnPad; x++) tiles[GROUND_ROW]![x] = "ground";

  const enemies: Enemy[] = [];
  let cursor = spawnPad;
  let lastChunkName = "";
  let consecutiveGaps = 0;

  while (cursor < spawnPad + chunkArea) {
    const remaining = spawnPad + chunkArea - cursor;
    let chunk = pickChunk(rng, opts.difficulty, opts.theme);

    // Reject pathological sequences: a leading gap or two gaps in a row
    // would be unjumpable.
    if (chunk.name === "gap" && (consecutiveGaps > 0 || cursor === spawnPad)) {
      chunk = pickChunk(rng, opts.difficulty, opts.theme);
      if (chunk.name === "gap") chunk = pickChunk(rng, 1, opts.theme);
    }
    if (chunk.name === lastChunkName && chunk.name !== "flat-ground") {
      const alt = pickChunk(rng, opts.difficulty, opts.theme);
      if (alt.name !== chunk.name) chunk = alt;
    }

    const wanted = chunkWidth(chunk, rng, remaining);
    if (wanted > remaining) break;

    const result = chunk.build({ width: wanted, height, rng, theme: opts.theme });
    for (let dx = 0; dx < wanted; dx++) {
      const col = result.columns[dx];
      if (!col) continue;
      for (let y = 0; y < height; y++) {
        tiles[y]![cursor + dx] = col[y] ?? "empty";
      }
    }
    for (const enemy of result.enemies) {
      enemies.push({ ...enemy, x: enemy.x + cursor });
    }

    cursor += wanted;
    consecutiveGaps = chunk.name === "gap" ? consecutiveGaps + 1 : 0;
    lastChunkName = chunk.name;
  }

  // Trail of flat ground for anything chunks didn't cover, then flag pad.
  for (let x = cursor; x < length; x++) tiles[GROUND_ROW]![x] = "ground";
  tiles[GROUND_ROW - 1]![length - 2] = "flag";

  return {
    id: opts.id ?? nextId("lvl"),
    theme: opts.theme,
    width: length,
    height,
    tiles,
    enemies,
    playerStart: { x: 2, y: GROUND_ROW - 1 },
  };
}

// -------- pure authoring functions --------

export function placeTile(
  level: Level,
  x: number,
  y: number,
  type: TileType,
): ToolResult<Level> {
  if (!inBounds(level, x, y)) {
    return {
      ok: false,
      error: `placeTile: (${x},${y}) out of bounds for ${level.width}x${level.height}`,
    };
  }
  const next = cloneLevel(level);
  next.tiles[y]![x] = type;
  return { ok: true, data: next };
}

export function spawnEnemy(
  level: Level,
  x: number,
  y: number,
  type: EnemyType,
): ToolResult<Level> {
  if (!inBounds(level, x, y)) {
    return { ok: false, error: `spawnEnemy: (${x},${y}) out of bounds` };
  }
  const tile = level.tiles[y]?.[x];
  if (tile && SOLID_TILES.has(tile)) {
    return {
      ok: false,
      error: `spawnEnemy: cannot spawn inside solid tile (${tile}) at (${x},${y})`,
    };
  }
  const next = cloneLevel(level);
  next.enemies.push({ x, y, type });
  return { ok: true, data: next };
}

export function setPlayerStart(
  level: Level,
  x: number,
  y: number,
): ToolResult<Level> {
  if (!inBounds(level, x, y)) {
    return { ok: false, error: `setPlayerStart: (${x},${y}) out of bounds` };
  }
  const tile = level.tiles[y]?.[x];
  if (tile && SOLID_TILES.has(tile)) {
    return {
      ok: false,
      error: `setPlayerStart: would spawn inside solid tile (${tile})`,
    };
  }
  const next = cloneLevel(level);
  next.playerStart = { x, y };
  return { ok: true, data: next };
}

// -------- describe_level --------

export function describeLevel(level: Level): string {
  const tileCounts: Record<TileType, number> = {
    ground: 0,
    brick: 0,
    pipe: 0,
    coin: 0,
    flag: 0,
    empty: 0,
  };
  for (const row of level.tiles) for (const t of row) tileCounts[t] += 1;

  const enemyCounts: Record<EnemyType, number> = {
    goomba: 0,
    koopa: 0,
    piranha: 0,
    kiosk: 0,
  };
  for (const e of level.enemies) enemyCounts[e.type] += 1;

  const groundRow = level.tiles[GROUND_ROW];
  const gaps: Array<{ start: number; end: number }> = [];
  if (groundRow) {
    let gapStart: number | null = null;
    for (let x = 0; x < level.width; x++) {
      const t = groundRow[x];
      const solid = t ? SOLID_TILES.has(t) : false;
      if (!solid && gapStart === null) gapStart = x;
      if (solid && gapStart !== null) {
        gaps.push({ start: gapStart, end: x - 1 });
        gapStart = null;
      }
    }
    if (gapStart !== null) gaps.push({ start: gapStart, end: level.width - 1 });
  }

  const flag = findFirstTile(level, "flag");
  const lines: string[] = [
    `Level "${level.id}" — theme=${level.theme}, ${level.width}×${level.height} tiles.`,
    `Tiles: ground=${tileCounts.ground}, brick=${tileCounts.brick}, pipe=${tileCounts.pipe}, coin=${tileCounts.coin}, flag=${tileCounts.flag}.`,
    `Enemies: goomba=${enemyCounts.goomba}, koopa=${enemyCounts.koopa}, piranha=${enemyCounts.piranha}, kiosk=${enemyCounts.kiosk}.`,
    `Player start: (${level.playerStart.x}, ${level.playerStart.y}).`,
    flag
      ? `Flag at (${flag.x}, ${flag.y}).`
      : `No flag tile — level has no win condition.`,
  ];
  if (gaps.length > 0) {
    lines.push(
      "Ground gaps at columns: " +
        gaps
          .map((g) => (g.start === g.end ? `${g.start}` : `${g.start}-${g.end}`))
          .join(", ") +
        ".",
    );
  } else {
    lines.push("No gaps in the ground row.");
  }
  return lines.join("\n");
}

function findFirstTile(level: Level, type: TileType): { x: number; y: number } | null {
  for (let y = 0; y < level.height; y++) {
    const row = level.tiles[y];
    if (!row) continue;
    for (let x = 0; x < level.width; x++) {
      if (row[x] === type) return { x, y };
    }
  }
  return null;
}

// -------- LevelStore --------
// Convenience wrapper for the MCP server: holds levels by id, notifies
// subscribers (the WebSocket bridge) on every mutation.

export class LevelStore {
  private levels = new Map<string, Level>();
  private listeners = new Set<(level: Level) => void>();
  private currentId: string | null = null;

  list(): string[] {
    return Array.from(this.levels.keys());
  }

  get(id: string): Level | undefined {
    return this.levels.get(id);
  }

  current(): Level | null {
    return this.currentId ? this.levels.get(this.currentId) ?? null : null;
  }

  put(level: Level): Level {
    this.levels.set(level.id, level);
    if (this.currentId === level.id) this.notify(level);
    return level;
  }

  load(id: string): ToolResult<Level> {
    const level = this.levels.get(id);
    if (!level) return { ok: false, error: `load: unknown level "${id}"` };
    this.currentId = id;
    this.notify(level);
    return { ok: true, data: level };
  }

  generate(opts: GenerateLevelOptions): Level {
    const level = generateLevel(opts);
    this.put(level);
    return level;
  }

  mutate(
    id: string,
    fn: (level: Level) => ToolResult<Level>,
  ): ToolResult<Level> {
    const level = this.levels.get(id);
    if (!level) return { ok: false, error: `mutate: unknown level "${id}"` };
    const result = fn(level);
    if (!result.ok) return result;
    this.put(result.data);
    return result;
  }

  subscribe(fn: (level: Level) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(level: Level): void {
    for (const fn of this.listeners) fn(level);
  }
}
