import { Difficulty, GROUND_ROW } from "./constants.js";
import { Enemy, Theme, TileType } from "./types.js";

export interface ChunkContext {
  width: number;
  height: number;
  rng: () => number;
  theme: Theme;
}

export interface ChunkResult {
  // columns[x][y] — width columns, each `height` tall, top-left origin
  columns: TileType[][];
  // enemies in chunk-local x coords; y is absolute row in the level
  enemies: Enemy[];
}

export interface Chunk {
  name: string;
  minWidth: number;
  maxWidth: number;
  weights: Record<Difficulty, number>;
  themes?: ReadonlySet<Theme>;
  build(ctx: ChunkContext): ChunkResult;
}

function emptyColumn(height: number): TileType[] {
  return Array.from({ length: height }, () => "empty");
}

function groundColumn(height: number): TileType[] {
  const col = emptyColumn(height);
  col[GROUND_ROW] = "ground";
  return col;
}

function pickInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const flatGround: Chunk = {
  name: "flat-ground",
  minWidth: 4,
  maxWidth: 8,
  weights: { 1: 6, 2: 5, 3: 3, 4: 2, 5: 1 },
  build({ width, height }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) columns.push(groundColumn(height));
    return { columns, enemies: [] };
  },
};

const gap: Chunk = {
  name: "gap",
  minWidth: 2,
  maxWidth: 4,
  weights: { 1: 0, 2: 1, 3: 3, 4: 4, 5: 5 },
  build({ width, height }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) columns.push(emptyColumn(height));
    return { columns, enemies: [] };
  },
};

const staircaseUp: Chunk = {
  name: "staircase-up",
  minWidth: 4,
  maxWidth: 6,
  weights: { 1: 2, 2: 3, 3: 3, 4: 3, 5: 2 },
  build({ width, height }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) {
      const col = groundColumn(height);
      const stepHeight = Math.min(x + 1, 4);
      for (let s = 1; s <= stepHeight; s++) col[GROUND_ROW - s] = "brick";
      columns.push(col);
    }
    return { columns, enemies: [] };
  },
};

const staircaseDown: Chunk = {
  name: "staircase-down",
  minWidth: 4,
  maxWidth: 6,
  weights: { 1: 2, 2: 3, 3: 3, 4: 3, 5: 2 },
  build({ width, height }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) {
      const col = groundColumn(height);
      const stepHeight = Math.min(Math.max(width - x, 1), 4);
      for (let s = 1; s <= stepHeight; s++) col[GROUND_ROW - s] = "brick";
      columns.push(col);
    }
    return { columns, enemies: [] };
  },
};

const pipeWithPiranha: Chunk = {
  name: "pipe-with-piranha",
  minWidth: 5,
  maxWidth: 6,
  weights: { 1: 0, 2: 2, 3: 3, 4: 4, 5: 4 },
  build({ width, height, rng }) {
    const columns: TileType[][] = [];
    const pipeX = Math.floor(width / 2);
    const pipeHeight = pickInt(rng, 2, 3);
    for (let x = 0; x < width; x++) {
      const col = groundColumn(height);
      if (x === pipeX || x === pipeX + 1) {
        for (let p = 1; p <= pipeHeight; p++) col[GROUND_ROW - p] = "pipe";
      }
      columns.push(col);
    }
    const enemies: Enemy[] = [
      { x: pipeX, y: GROUND_ROW - pipeHeight - 1, type: "piranha" },
    ];
    return { columns, enemies };
  },
};

const floatingPlatforms: Chunk = {
  name: "floating-platforms",
  minWidth: 5,
  maxWidth: 8,
  weights: { 1: 2, 2: 3, 3: 3, 4: 2, 5: 2 },
  build({ width, height, rng }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) columns.push(groundColumn(height));
    const platformY = pickInt(rng, 8, 10);
    const platformStart = pickInt(rng, 1, Math.max(1, width - 4));
    for (let x = platformStart; x < platformStart + 3 && x < width; x++) {
      const col = columns[x];
      if (!col) continue;
      col[platformY] = "brick";
      col[platformY - 1] = "coin";
    }
    return { columns, enemies: [] };
  },
};

const enemyCluster: Chunk = {
  name: "enemy-cluster",
  minWidth: 5,
  maxWidth: 8,
  weights: { 1: 0, 2: 1, 3: 3, 4: 4, 5: 5 },
  build({ width, height, rng }) {
    const columns: TileType[][] = [];
    for (let x = 0; x < width; x++) columns.push(groundColumn(height));
    const count = pickInt(rng, 2, 3);
    const enemies: Enemy[] = [];
    const placed = new Set<number>();
    for (let i = 0; i < count; i++) {
      let x = pickInt(rng, 1, width - 2);
      let attempt = 0;
      while (placed.has(x) && attempt < 5) {
        x = pickInt(rng, 1, width - 2);
        attempt++;
      }
      placed.add(x);
      const type = rng() < 0.6 ? "goomba" : "koopa";
      enemies.push({ x, y: GROUND_ROW - 1, type });
    }
    return { columns, enemies };
  },
};

export const CHUNK_LIBRARY: ReadonlyArray<Chunk> = [
  flatGround,
  gap,
  staircaseUp,
  staircaseDown,
  pipeWithPiranha,
  floatingPlatforms,
  enemyCluster,
];

export function pickChunk(
  rng: () => number,
  difficulty: Difficulty,
  theme: Theme,
): Chunk {
  const candidates = CHUNK_LIBRARY.filter(
    (c) => !c.themes || c.themes.has(theme),
  );
  const total = candidates.reduce((s, c) => s + c.weights[difficulty], 0);
  if (total <= 0) return candidates[0] ?? flatGround;
  let roll = rng() * total;
  for (const c of candidates) {
    roll -= c.weights[difficulty];
    if (roll <= 0) return c;
  }
  return candidates[candidates.length - 1] ?? flatGround;
}

export function chunkWidth(
  chunk: Chunk,
  rng: () => number,
  remaining: number,
): number {
  const max = Math.min(chunk.maxWidth, Math.max(chunk.minWidth, remaining));
  return pickInt(rng, chunk.minWidth, max);
}
