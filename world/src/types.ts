// Shared contract. Single source of truth — both engine/ and mcp-server/ import from here.
// Do not change without a 2-minute team standup (see TOOLS.md).

export type TileType = "ground" | "brick" | "pipe" | "coin" | "flag" | "empty";
export type EnemyType = "goomba" | "koopa" | "piranha" | "kiosk";
export type Theme = "overworld" | "underground" | "castle" | "ice" | "spooky";

export interface Enemy {
  x: number;       // tile units
  y: number;       // tile units
  type: EnemyType;
}

export interface Level {
  id: string;
  theme: Theme;
  width: number;             // tile units
  height: number;            // tile units (usually 15)
  tiles: TileType[][];       // [y][x], origin top-left
  enemies: Enemy[];
  playerStart: { x: number; y: number };  // tile units
}

export const SOLID_TILES: ReadonlySet<TileType> = new Set(["ground", "brick", "pipe"]);
export const TRIGGER_TILES: ReadonlySet<TileType> = new Set(["flag", "coin"]);
