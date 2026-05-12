import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Level, TileType, EnemyType } from "../../world/src/types.js";

const here = dirname(fileURLToPath(import.meta.url));

function findFixture(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, "fixtures/sample-level.json");
    if (existsSync(candidate)) return candidate;
    dir = resolve(dir, "..");
  }
  throw new Error(`could not locate fixtures/sample-level.json from ${start}`);
}

const fixturePath = findFixture(here);

let currentLevel: Level = JSON.parse(readFileSync(fixturePath, "utf8")) as Level;

export function getLevel(): Level {
  return currentLevel;
}

export function loadLevel(level: Level): void {
  currentLevel = level;
}

export function placeTile(x: number, y: number, type: TileType): void {
  assertInBounds(x, y);
  currentLevel.tiles[y][x] = type;
}

export function spawnEnemy(x: number, y: number, type: EnemyType): void {
  assertInBounds(x, y);
  currentLevel.enemies.push({ x, y, type });
}

export function setPlayerStart(x: number, y: number): void {
  assertInBounds(x, y);
  currentLevel.playerStart = { x, y };
}

function assertInBounds(x: number, y: number): void {
  const { width, height } = currentLevel;
  if (x < 0 || x >= width || y < 0 || y >= height) {
    throw new Error(
      `out of bounds: (${x},${y}) — level is ${width}x${height} (tile units, origin top-left)`,
    );
  }
}
