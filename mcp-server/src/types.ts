export type TileType = "ground" | "brick" | "pipe" | "coin" | "flag" | "empty";
export type EnemyType = "goomba" | "koopa" | "piranha";
export type Theme = "overworld" | "underground" | "castle" | "ice" | "spooky";

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
}

export interface Level {
  id: string;
  theme: Theme;
  width: number;
  height: number;
  tiles: TileType[][];
  enemies: Enemy[];
  playerStart: { x: number; y: number };
}
